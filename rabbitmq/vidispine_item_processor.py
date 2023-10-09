from .MessageProcessor import MessageProcessor
from .item_notification import ItemNotification
import logging
from gnm_deliverables.models import DeliverableAsset
import time

logger = logging.getLogger(__name__)


class VidispineItemProcessor(MessageProcessor):
    routing_key = "vidispine.item.delete"
    # see https://json-schema.org/learn/miscellaneous-examples.html for more details
    schema = {
        "type": "object",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "properties": {
            "field": {
                "type": "array",
                "items": {
                    "$ref": "#/definitions/kvpair"
                }
            }
        },
        "definitions": {
            "kvpair": {
                "type": "object",
                "required": ["key","value"],
                "properties": {
                    "key": {"type": "string"},
                    "value": {"type": "string"}
                }
            }
        }
    }

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body: dict):
        """
        Receives the validated Vidispine JSON message.
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

        notification = ItemNotification(body)

        time.sleep(2)

        assets = DeliverableAsset.objects.filter(online_item_id=notification.itemId)

        if not assets:
            logger.info("Received a message for Vidispine item {0}. Cannot find a matching asset.".format(notification.itemId))
            return

        try:
            for asset in assets:
                logger.info("Attempting to remove the Vidispine id. from asset {0} due to it being tied to deleted Vidispine item {1}.".format(asset.id, notification.itemId))
                asset.online_item_id = None
                asset.save()
        except Exception as e:
            logger.error("Failed to remove the Vidispine id. from asset {0}. Error was: {1}".format(asset.id, e))
            return

        return notification
