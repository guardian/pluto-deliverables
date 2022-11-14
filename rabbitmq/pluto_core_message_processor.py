from .MessageProcessor import MessageProcessor
import logging
from gnm_deliverables.models import DeliverableAsset, Deliverable
import os
from gnm_deliverables.files import get_path_for_deliverable
import shutil

logger = logging.getLogger(__name__)


class PlutoCoreMessageProcessor(MessageProcessor):
    routing_key = "deliverables.deliverable.pluto.core.delete"
    schema = {
        "type": "object",
        "properties": {
            "project_id": {"type": "number"}
        }
    }

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body: dict):
        """
        Takes an incoming message, looks up the bundle based on the project id. and attempts to delete the bundle and any assets for it.
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
            parent_bundle = Deliverable.objects.get(pluto_core_project_id=body["project_id"])
            deliverables = DeliverableAsset.objects.filter(deliverable=parent_bundle)

            for asset in deliverables:
                try:
                    if os.path.exists(str(asset.absolute_path)):
                        asset.remove_file()
                    asset.purge()
                    if asset.online_item_id is None:
                        asset.delete()
                except Exception as e:
                    logger.error("Could not delete existing path or asset for asset {0}: {1}".format(str(asset), str(e)))

            try:
                if os.path.exists(str(get_path_for_deliverable(parent_bundle.name))):
                    shutil.rmtree(str(get_path_for_deliverable(parent_bundle.name)), ignore_errors=True)
            except Exception as e:
                logger.error("Could not delete folder for bundle {0}: {1}".format(str(body["project_id"]), str(e)))

            parent_bundle.delete()

        except Exception as e:
            logger.error("Could not delete bundle {0}: {1}".format(str(body["project_id"]), str(e)))
