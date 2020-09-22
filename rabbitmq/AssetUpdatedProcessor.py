from .MessageProcessor import MessageProcessor
from gnm_deliverables.models import DeliverableAsset
from .time_funcs import get_current_time
import logging
import gnm_deliverables.choices as choices
from datetime import datetime
logger = logging.getLogger(__name__)



class AssetUpdatedProcessor(MessageProcessor):
    """
    this class processes messages from our own source, in order to seperate side-effects from main effects
    """
    routing_key = "deliverables.deliverableasset.update"
    #there is something weird with the DeliverableAsset serializer, so fall back to standard jsonschema validation
    schema = {
        "type": "object",
        "properties": {
            "id": {"type": "number"},
            "type": {"type": "number"},
            "filename": {"type": "string"},
            "status": {"type": "number"},
            "deliverable": {"type":"number"}
        }
    }

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        # there is something strange with the serializer, if we just build an object from body we miss out
        # most of the fields.
        if "id" in body:
            asset = DeliverableAsset.objects.get(id=body["id"])
            logger.debug("loaded asset {0}".format(asset.__dict__))
        else:
            logger.error("Incoming message had no ID. Offending data was: {0}".format(body))
            return

        if asset.ingest_complete_dt is not None:
            completed_ago = get_current_time() - asset.ingest_complete_dt
        else:
            completed_ago = None
        if asset.file_removed_dt is None: #if it happened more than 5 minutes ago then it's probably an old notification
            if completed_ago is not None and completed_ago.days>1:
                logger.warning(("Received notification that {name} (asset {assetid} on bundle {bundleid}) was " +
                               "updated where the source file is not removed but ingest completed {ago} ago. " +
                               "This may be a false notification, if not then delete the file {abspath} manually").format(
                                name=str(asset),
                                assetid=asset.id,
                                bundleid=asset.deliverable_id,
                                ago=completed_ago,
                                abspath=asset.absolute_path,
                               ))
            if asset.status==choices.DELIVERABLE_ASSET_STATUS_TRANSCODED:
                logger.info("{0} ({1}) completed ingest & transcode {2} ago; removing file if it exists".format(str(asset), asset.absolute_path, completed_ago))
                asset.remove_file()
            elif asset.status==choices.DELIVERABLE_ASSET_STATUS_INGESTED:
                logger.info("{0} ({1}) completed ingest with possible ongoing transcode {2} ago; removing file if it exists".format(str(asset), asset.absolute_path, completed_ago))
                asset.remove_file()
            else:
                logger.debug("{0} updated item was not in a completed state".format(str(asset)))
