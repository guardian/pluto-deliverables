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

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        """
        Takes an incoming message, looks up the asset based on the old Vidispine job id. and replaces it with the new one.
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

        try:
            asset = DeliverableAsset.objects.get(job_id=body["old"])
        except DeliverableAsset.DoesNotExist:
            logger.warning("Received a message for job {0}. Cannot find a matching asset.".format(body["old"]))
            return

        asset.job_id = body["new"]
        asset.save()


