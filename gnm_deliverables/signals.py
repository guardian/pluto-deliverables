from django.db.models.signals import post_save, post_delete
from .models import Deliverable, DeliverableAsset
from django.dispatch import receiver
import logging
from rest_framework.renderers import JSONRenderer
import pika
import pika.exceptions
from django.conf import settings
from time import sleep
from rabbitmq.declaration import declare_rabbitmq_setup
import os

logger = logging.getLogger(__name__)


class MessageRelay(object):
    """
    MessageRelay encapsulates the logic that sends messages to rabbitmq. This is done to lazily initialize the connection.
    """
    @staticmethod
    def setup_connection():
        connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=getattr(settings,"RABBITMQ_HOST","localhost"),
                port=getattr(settings,"RABBITMQ_PORT", 5672),
                virtual_host=getattr(settings, "RABBITMQ_VHOST", "prexit"),
                credentials=pika.credentials.PlainCredentials(
                    getattr(settings,"RABBITMQ_USER","pluto-ng"),
                    getattr(settings,"RABBITMQ_PASSWD","")
                )
            )
        )
        channel = connection.channel()
        declare_rabbitmq_setup(channel)
        return channel

    def send_content(self, routing_key:str, payload:bytes, connect_attempt=0):
        max_attempts = getattr(settings,"RABBITMQ_MAX_SEND_ATTEMPTS",10)
        try:
            channel = MessageRelay.setup_connection()
            channel.basic_publish(
                exchange='pluto-deliverables',
                routing_key=routing_key,
                body=payload
            )
        except (pika.exceptions.ChannelWrongStateError, pika.exceptions.AMQPConnectionError, pika.exceptions.AMQPChannelError) as e:
            if "CI" in os.environ:
                logger.warning("Ignoring connection error as we are in CI mode")
                return
            if connect_attempt>max_attempts:
                logger.error("Could not re-establish broker connection after {0} attempts, giving up")
                raise
            else:
                sleep(2*connect_attempt)
                logger.warning("Message queue connection was lost: {0}. Attempting to reconnect, attempt {1}".format(str(e), connect_attempt))
                self.send_content(routing_key, payload, connect_attempt+1)

    def relay_message(self, affected_model, action):
        from .serializers import DeliverableSerializer, DeliverableAssetSerializer

        try:
            if isinstance(affected_model, Deliverable):
                logger.info("{0} an instance of Deliverable with id {1}".format(action, affected_model.project_id))
                content = DeliverableSerializer(affected_model)
            elif isinstance(affected_model, DeliverableAsset):
                logger.info("{0} an instance of DeliverableAsset with id {1} at {2}".format(action, affected_model.pk, affected_model.absolute_path))
                content = DeliverableAssetSerializer(affected_model)
            elif affected_model.__class__.__name__=="Migration": #silently ignore this one
                content = None
            elif affected_model.__class__.__name__=="User": #silently ignore this one
                content = None
            else:
                content = None
                logger.error("model_saved got an unexpected model class: {0}.{1}".format(affected_model.__class__.__module__, affected_model.__class__.__name__))

            if content:
                routing_key = "deliverables.{0}.{1}".format(affected_model.__class__.__name__.lower(), action)
                payload = JSONRenderer().render(content.data)
                self.send_content(routing_key, payload)

        except Exception as e:
            logger.error("Could not relay message of {0} on {1}: {2}".format(action, affected_model, str(e)))
            logger.exception(e) #we don't want to bring down the app here, log it out and hope somebody sees



msgrelay = MessageRelay()


@receiver(post_save)
def model_saved(sender, **kwargs):
    did_create = kwargs.get("created")
    if did_create:
        action = "create"
    else:
        action = "update"
    return msgrelay.relay_message(kwargs.get("instance"), action)


@receiver(post_delete)
def model_deleted(sender, **kwargs):
    return msgrelay.relay_message(kwargs.get("instance"), "delete")

