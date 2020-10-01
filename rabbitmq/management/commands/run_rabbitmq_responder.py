from django.core.management.base import BaseCommand
import logging
import pika
from django.conf import settings
import re
from functools import partial
import sys
import signal

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Runs the responder program for in-cluster messages"

    def __init__(self, *args, **kwargs):
        super(Command, self).__init__(*args,**kwargs)
        self.exit_code = 0
        self.runloop = None

    @staticmethod
    def connect_channel(exchange_name, handler, channel):
        """
        async callback that is used to connect a channel once it has been declared
        :param channel: channel to set up
        :param exchange_name: str name of the exchange to connect to
        :param handler: a MessageProcessor class (NOT instance)
        :return:
        """
        logger.info("Establishing connection to exchange {0} from {1}...".format(exchange_name, handler.__class__.__name__))
        sanitised_routingkey = re.sub(r'[^\w\d]', '', handler.routing_key)

        queuename = "deliverables-{0}".format(sanitised_routingkey)
        channel.queue_declare("deliverables-dlq", durable=True)
        channel.queue_bind("deliverables-dlq","deliverables-dlx")

        channel.exchange_declare(exchange=exchange_name, exchange_type="topic")
        channel.queue_declare(queuename, arguments={
            'x-message-ttl': getattr(settings,"RABBITMQ_QUEUE_TTL", 5000),
            'x-dead-letter-exchange': "deliverables-dlx"
        })
        channel.queue_bind(queuename, exchange_name, routing_key=handler.routing_key)
        channel.basic_consume(queuename,
                              handler.raw_message_receive,
                              auto_ack=False,
                              exclusive=False,
                              callback=lambda consumer: logger.info("Consumer started for {0} from {1}".format(queuename, exchange_name)),
                              )

    def channel_opened(self, connection):
        """
        async callback that is invoked when the connection is ready.
        it is used to connect up the channels
        :param connection: rabbitmq connection
        :return:
        """
        from rabbitmq.mappings import EXCHANGE_MAPPINGS
        logger.info("Connection opened")
        for i in range(0, len(EXCHANGE_MAPPINGS)):
            # partial adjusts the argument list, adding the args here onto the _start_ of the list
            # so the args are (exchange, handler, channel) not (channel, exchange, handler)
            chl = connection.channel(on_open_callback=partial(Command.connect_channel,
                                                              EXCHANGE_MAPPINGS[i]["exchange"],
                                                              EXCHANGE_MAPPINGS[i]["handler"]),
                                     )
            chl.add_on_close_callback(self.channel_closed)
            chl.add_on_cancel_callback(self.channel_closed)

    def channel_closed(self, connection, error=None):
        logger.error("RabbitMQ connection failed: {0}".format(str(error)))
        self.exit_code = 1
        self.runloop.stop()

    def connection_closed(self, connection, error=None):
        """
        async callback that is invoked when the connection fails.
        print an error and shut down, this will then get detected as a crash-loop state
        :param connection:
        :param error:
        :return:
        """
        logger.error("RabbitMQ connection failed: {0}".format(str(error)))
        self.exit_code = 1
        connection.ioloop.stop()

    def handle(self, *args, **options):
        connection = pika.SelectConnection(
            pika.ConnectionParameters(
                host=settings.RABBITMQ_HOST,
                port=getattr(settings, "RABBITMQ_PORT", 5672),
                virtual_host=getattr(settings, "RABBITMQ_VHOST", "/"),
                credentials=pika.PlainCredentials(username=settings.RABBITMQ_USER, password=settings.RABBITMQ_PASSWD),
                connection_attempts=getattr(settings, "RABBITMQ_CONNECTION_ATTEMPTS", 3),
                retry_delay=getattr(settings, "RABBITMQ_RETRY_DELAY", 3)
            ),
            on_open_callback=self.channel_opened,
            on_close_callback=self.connection_closed,
            on_open_error_callback=self.connection_closed,
        )

        self.runloop = connection.ioloop

        def on_quit(signum, frame):
            logger.info("Caught signal {0}, exiting...".format(signum))
            connection.ioloop.stop()

        signal.signal(signal.SIGINT, on_quit)
        signal.signal(signal.SIGTERM, on_quit)

        connection.ioloop.start()
        logger.info("terminated")
        sys.exit(self.exit_code)