import pika
from django.conf import settings


def declare_rabbitmq_setup(channel: pika.channel.Channel):
    """
    rabbitmq expects us to declare the exchange setup whenever we start up and these must always agree.
    therefore it is done here
    :return:
    """
    channel.exchange_declare(exchange_type='topic',exchange=getattr(settings, "RABBITMQ_EXCHANGE", 'pluto-deliverables'))
    channel.exchange_declare(exchange="deliverables-dlx", exchange_type="direct")
