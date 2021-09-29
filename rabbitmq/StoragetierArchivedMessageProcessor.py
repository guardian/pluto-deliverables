from .MessageProcessor import MessageProcessor
from .serializers import StoragetierSuccessMessageSerializer
from .models import StoragetierSuccessMessage
from gnm_deliverables.models import DeliverableAsset

import logging

logger = logging.getLogger(__name__)


class StoragetierArchivedMessageProcessor(MessageProcessor):
    routing_key = "storagetier.onlinearchive.mediaingest.success"
    serializer = StoragetierSuccessMessageSerializer

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        """
        handles the incoming message
        :param exchange_name:
        :param routing_key:
        :param delivery_tag:
        :param body:
        :return:
        """
        msg = StoragetierSuccessMessage(**body) #it's been validated already before this method is called

        if not msg.archiveHunterIDValidated:
            logger.warning("Received message with a non-validated ID, this should not happen. Offending content was {0}".format(body))
            raise ValueError("Expected a valid archivehunter ID")

        #an exception raised here will result in the message being NACK'd and the error being written to the log
        matching_assets = DeliverableAsset.objects.filter(absolute_path=msg.originalFilePath)
        if len(matching_assets) == 0:
            logger.info("No deliverables found with a filepath matching {0}".format(msg.originalFilePath))
            return
        if len(matching_assets) > 1:
            logger.warning("Expected 1 asset to match {0} but got {1}!".format(msg.originalFilePath, len(matching_assets)))

        for rec in matching_assets:
            if rec.archive_item_id == msg.archiveHunterID:
                logger.info("Record {0} ({1}) already has the archive ID {2} set".format(rec.pk, rec.absolute_path, msg.archiveHunterID))
            elif rec.archive_item_id is not None:
                logger.warning("Record {0} ({1}) already has a different archive ID set: {2}. Not changing it.".format(rec.pk, rec.absolute_path, rec.archive_item_id))
            else:
                logger.info("Updating archive item ID on {0} ({1}) to {2}".format(rec.pk, rec.absolute_path, msg.archiveHunterID))
                rec.archive_item_id = msg.archiveHunterID
                rec.save()
