from .MessageProcessor import MessageProcessor
from .job_notification import JobNotification
import logging
from django.conf import settings
from gnmvidispine.vs_item import VSItem
from gnmvidispine.vidispine_api import VSException
from gnm_deliverables.choices import DELIVERABLE_ASSET_TYPES, \
    DELIVERABLE_ASSET_STATUS_NOT_INGESTED, \
    DELIVERABLE_ASSET_STATUS_INGESTED, \
    DELIVERABLE_ASSET_STATUS_INGEST_FAILED, DELIVERABLE_ASSET_STATUS_INGESTING, \
    DELIVERABLE_ASSET_STATUS_TRANSCODED, \
    DELIVERABLE_ASSET_STATUS_TRANSCODE_FAILED, DELIVERABLE_ASSET_STATUS_TRANSCODING
from rabbitmq.time_funcs import get_current_time
from gnm_deliverables.models import *
from time import sleep
from random import randint

logger = logging.getLogger(__name__)


class VidispineMessageProcessor(MessageProcessor):
    routing_key = "vidispine.job.*.*"
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

    def get_item_metadata(self, item_id):
        if item_id is not None:
            try:
                vs_item = VSItem(url=settings.VIDISPINE_URL,
                                 user=settings.VIDISPINE_USER,
                                 passwd=settings.VIDISPINE_PASSWORD)
                vs_item.populate(item_id,specificFields=["durationSeconds","__version"])
                version = vs_item.get("__version",allowArray=True)
                if isinstance(version, list):
                    logger.warning("{0} has multiple versions: {1}, using the first".format(item_id, version))
                    version = version[0]
                possibly_seconds = vs_item.get("durationSeconds")
                if possibly_seconds is not None:
                    duration_seconds = float(possibly_seconds)
            except ValueError:
                logger.warning("{0}: duration_seconds value '{1}' could not be converted to float".format(item_id, vs_item.get("durationSeconds")))
            except VSException as e:
                logger.warning("Could not get extra metadata for {0} from Vidispine: {1}".format(item_id, str(e)))
        if duration_seconds is not None:
            logger.debug("Got duration as " + str(duration_seconds) + " seconds")
        if version is not None:
            logger.debug("Got version: " + version)
        return duration_seconds, version

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body: dict):
        """
        receives the validated vidispine json message.
        :param exchange_name:
        :param routing_key:
        :param delivery_tag:
        :param body:
        :return:
        """
        logger.info("Got incoming message: " + str(body))
        logger.info("Exchange name: {0}".format(exchange_name))
        logger.info("Routing key: {0}".format(routing_key))
        logger.info("Delivery tag: {0}".format(delivery_tag))

        try:
            notification = JobNotification(body)
        except Exception as e:
            logger.warning("Incoming message lacked one or more required fields. {0}".format(e))
            return

        try:
            asset = DeliverableAsset.objects.get(job_id=notification.jobId)
        except DeliverableAsset.DoesNotExist:
            logger.warning("Received a message for job {0}. Cannot find a matching asset.".format(notification.jobId))
            return

        if notification.status in ['FAILED_TOTAL', 'ABORTED_PENDING', 'ABORTED']:
            if notification.type == 'TRANSCODE':
                asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODE_FAILED
            else:
                asset.status = DELIVERABLE_ASSET_STATUS_INGEST_FAILED
            asset.ingest_complete_dt = get_current_time()
            asset.save()
        elif notification.status == 'READY' or notification.status == 'STARTED' or notification.status == 'VIDINET_JOB':
            if notification.type == 'TRANSCODE':
                asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODING
            else:
                asset.status = DELIVERABLE_ASSET_STATUS_INGESTING
            asset.save()
        elif notification.status == 'FINISHED':
            if notification.type == 'TRANSCODE':
                asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODED
                duration_seconds, version = self.get_item_metadata(notification.itemId)
                try:
                    asset.version = int(version)
                except ValueError as e:
                    logger.warning("{0}: asset version '{1}' could not be converted into number".format(notification.itemId, version))
                asset.duration_seconds = duration_seconds
                asset.ingest_complete_dt = get_current_time()
            else:
                asset.online_item_id = notification.itemId
                if asset.type in [DELIVERABLE_ASSET_TYPE_OTHER_MISCELLANEOUS, DELIVERABLE_ASSET_TYPE_OTHER_PAC_FORMS, DELIVERABLE_ASSET_TYPE_OTHER_POST_PRODUCTION_SCRIPT, DELIVERABLE_ASSET_TYPE_OTHER_SUBTITLE]:
                    asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODED
                else:
                    asset.status = DELIVERABLE_ASSET_STATUS_INGESTED
            asset.save()

            #sleep(randint(2,16))

            if notification.type != 'TRANSCODE' and routing_key == 'vidispine.job.essence_version.stop':
                if asset.type in [DELIVERABLE_ASSET_TYPE_OTHER_MISCELLANEOUS, DELIVERABLE_ASSET_TYPE_OTHER_PAC_FORMS, DELIVERABLE_ASSET_TYPE_OTHER_POST_PRODUCTION_SCRIPT, DELIVERABLE_ASSET_TYPE_OTHER_SUBTITLE]:
                    logger.debug("Nothing to do.")
                else:
                    try:
                        asset_two = DeliverableAsset.objects.get(online_item_id=notification.itemId)
                    except DeliverableAsset.DoesNotExist:
                        logger.warning("Received a message for item {0}. Cannot find a matching asset.".format(notification.itemId))
                        return
                    if asset_two.status != DELIVERABLE_ASSET_STATUS_TRANSCODING and asset_two.status != DELIVERABLE_ASSET_STATUS_TRANSCODED:
                        try:
                            asset.create_proxy()
                        except Exception as e:
                            logger.exception(
                                "{0} for asset {1} in bundle {2}: could not create proxy due to:".format(
                                    asset.online_item_id,
                                    asset.id,
                                    asset.deliverable.id),
                                exc_info=e)
