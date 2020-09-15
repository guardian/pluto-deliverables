from .MessageProcessor import MessageProcessor
from .serializers import MasterUpdateMessageSerializer


class AtomResponderProcessor(MessageProcessor):
    routing_key = "atomresponder.master.#"
    serializer = MasterUpdateMessageSerializer

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        """
        handles the incoming message
        :param exchange_name:
        :param routing_key:
        :param delivery_tag:
        :param body:
        :return:
        """