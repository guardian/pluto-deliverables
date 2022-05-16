from .MessageProcessor import MessageProcessor
import logging
from gnm_deliverables.models import *

logger = logging.getLogger(__name__)


class AssetSweeperMessageProcessor(MessageProcessor):
    routing_key = "assetsweeper.permissions_monitor.vidispine_job_rerun"
    schema = {
        "type": "object",
        "properties": {
            "old": {"type": "string"},
            "new": {"type": "string"},
            "path": {"type": "string"}
        }
    }

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body: dict):
        """
        Receives the validated AssetSweeper JSON message.
        :param exchange_name:
        :param routing_key:
        :param delivery_tag:
        :param body:
        :return:
        """
        logger.debug("Got incoming message: " + str(body))
        logger.debug("Exchange name: {0}".format(exchange_name))
        logger.debug("Routing key: {0}".format(routing_key))
        logger.debug("Delivery tag: {0}".format(delivery_tag))

        return self.handle_message(body)

    def handle_message(self, message):
        """
        Takes an incoming message, looks up the asset based on the old Vidispine job id. and replaces it with the new one.
        :param message: The body of the message
        :return: none
        """
        try:
            asset = DeliverableAsset.objects.get(job_id=message.old)
        except DeliverableAsset.DoesNotExist:
            logger.warning("Received a message for job {0}. Cannot find a matching asset.".format(message.old))
            return

        asset.job_id = message.new
        asset.save()
