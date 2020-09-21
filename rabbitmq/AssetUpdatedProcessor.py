from .MessageProcessor import MessageProcessor
from gnm_deliverables.models import DeliverableAsset
import logging
import gnm_deliverables.choices as choices
from datetime import datetime
logger = logging.getLogger(__name__)


class AssetUpdatedProcessor(MessageProcessor):
    """
    this class processes messages from our own source, in order to seperate side-effects from main effects
    """
    routing_key = "deliverables.deliverableasset.update"
    serializer = DeliverableAsset

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        asset = DeliverableAsset(**body)

        completed_ago = datetime.now() - asset.ingest_complete_dt
        if asset.file_removed_dt is None: #if it happened more than 5 minutes ago then it's probably an old notification
            if completed_ago.days>1:
                logger.warning(("Received notification that {name} (asset {assetid} on bundle {bundleid}) was " +
                               "updated where the source file is not removed but ingest completed {ago} ago. " +
                               "This may be a false notification, if not then delete the file {abspath} manually").format(
                                name=str(asset),
                                assetid=asset.id,
                                bundleid=asset.deliverable_id,
                                ago=completed_ago,
                                abspath=asset.absolute_path(),
                               ))
            if asset.status==choices.DELIVERABLE_ASSET_STATUS_TRANSCODED:
                logger.info("{0} ({1}) completed ingest & transcode {2} ago; removing file if it exists".format(str(asset), asset.absolute_path, completed_ago))
                asset.remove_file()
            elif asset.status==choices.DELIVERABLE_ASSET_STATUS_INGESTED:
                logger.info("{0} ({1}) completed ingest with possible ongoing transcode {2} ago; removing file if it exists".format(str(asset), asset.absolute_path, completed_ago))
                asset.remove_file()
            else:
                logger.debug("{0} updated item was not in a completed state")
