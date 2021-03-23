from .MessageProcessor import MessageProcessor
from .job_notification import JobNotification
import logging
#from atomresponder.models import ImportJob
#from kinesisresponder.sentry import inform_sentry_exception
#from .transcode_check import check_for_broken_proxy, delete_existing_proxy, transcode_proxy
from datetime import datetime
import pytz
from django.conf import settings
from gnmvidispine.vs_item import VSItem
from gnmvidispine.vidispine_api import VSException
from gnm_deliverables.models import Deliverable, DeliverableAsset
#from gnm_deliverables.choices import DELIVERABLE_ASSET_TYPES, \
#    DELIVERABLE_ASSET_STATUS_NOT_INGESTED, \
#    DELIVERABLE_ASSET_STATUS_INGESTED, \
#    DELIVERABLE_ASSET_STATUS_INGEST_FAILED, DELIVERABLE_ASSET_STATUS_INGESTING, \
#    DELIVERABLE_ASSET_STATUS_TRANSCODED, \
#    DELIVERABLE_ASSET_STATUS_TRANSCODE_FAILED, DELIVERABLE_ASSET_STATUS_TRANSCODING
#from rabbitmq.time_funcs import get_current_time
#from gnm_deliverables.models import *

logger = logging.getLogger(__name__)

#time_zone: str = getattr(settings,"TIME_ZONE", "UTC")


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
        notification = JobNotification(body)

        job_id = None
        file_id = None
        item_id = None
        job_status = None
        job_type = None

        if notification.jobId is not None:
            logger.info("Got job id.: " + notification.jobId)
            job_id = notification.jobId
        if notification.fileId is not None:
            logger.info("Got file id.: " + notification.fileId)
            file_id = notification.fileId
        if notification.itemId is not None:
            logger.info("Got item id.: " + notification.itemId)
            item_id = notification.itemId
        #if notification.status is not None:
        #    logger.info("Got job status: " + notification.status)
        #    job_status = notification.status
        #if notification.type is not None:
        #    logger.info("Got job type: " + notification.type)
        #    job_type = notification.type

        duration_seconds = None
        version = None

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
            logger.info("Got duration as " + str(duration_seconds) + " seconds")
        if version is not None:
            logger.info("Got version: " + version)

        if job_id is not None:
            asset_id = None
            if notification.asset_id is not None:
                logger.info("Got asset id.: " + notification.asset_id)
                asset_id = notification.asset_id
            try:
                asset = DeliverableAsset.objects.get(job_id=job_id)
            except DeliverableAsset.DoesNotExist:
                if asset_id is not None:
                    logger.warning("Received a notification for asset {0} that does not exist".format(asset_id))
                    return

        #if job_status is not None:
        #    if job_status == 'FAILED' or job_status == 'ABORTED_PENDING' or job_status == "ABORTED":
        #        if job_type == 'TRANSCODE':
        #            asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODE_FAILED
        #        else:
        #            asset.status = DELIVERABLE_ASSET_STATUS_INGEST_FAILED
        #        asset.ingest_complete_dt = get_current_time()
        #        asset.save()
        #    elif job_status == 'READY' or job_status == 'STARTED' or job_status == 'VIDINET_JOB':
        #        if job_type == 'TRANSCODE':
        #            asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODING
        #        else:
        #            asset.status = DELIVERABLE_ASSET_STATUS_INGESTING
        #        asset.save()
        #    elif job_status == 'FINISHED':
        #        if job_type == 'TRANSCODE':
        #            asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODED
        #            try:
        #                asset.version = int(version)
        #            except ValueError as e:
        #                logger.warning("{0}: asset version '{1}' could not be converted into number".format(item_id, version))
        #            asset.duration_seconds = duration_seconds
        #            asset.ingest_complete_dt = get_current_time()
        #        else:
        #            asset.online_item_id = item_id
        #            if asset.type == DELIVERABLE_ASSET_TYPE_OTHER_MISCELLANEOUS or asset.type == DELIVERABLE_ASSET_TYPE_OTHER_PAC_FORMS or asset.type == DELIVERABLE_ASSET_TYPE_OTHER_POST_PRODUCTION_SCRIPT or asset.type == DELIVERABLE_ASSET_TYPE_OTHER_SUBTITLE:
        #                asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODED
        #            else:
        #                asset.status = DELIVERABLE_ASSET_STATUS_INGESTED
        #                try:
        #                    asset.create_proxy()
        #                except Exception as e:
        #                    logger.exception(
        #                        "{0} for asset {1} in bundle {2}: could not create proxy due to:".format(
        #                            asset.online_item_id,
        #                            asset.id,
        #                            asset.deliverable.id),
        #                        exc_info=e)
        #        asset.save()

        #if content.didFail:
        #    if content.type == "TRANSCODE":
        #        asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODE_FAILED
        #    else:
        #        asset.status = DELIVERABLE_ASSET_STATUS_INGEST_FAILED
        #    asset.ingest_complete_dt = get_current_time()
        #    asset.save()

        #importjob = ImportJob.objects.get(job_id=notification.jobId)
        #importjob.status = notification.status
        #importjob.processing = False
        #importjob.completed_at = datetime.now(tz=pytz.timezone(time_zone))
        #importjob.save()

        #if importjob.is_failed():
        #    VidispineMessageProcessor.handle_failed_job(importjob)
        #else:
        #    try:
        #        logger.info("{0}: Checking for broken proxy".format(importjob.item_id))
        #        should_regen, shape_id = check_for_broken_proxy(importjob.item_id)
        #        if should_regen:
        #            logger.info("{0}: Proxy needs regen. Existing shape id is {1}".format(importjob.item_id, shape_id))
        #            if shape_id is not None:
        #                logger.info("{0}: Deleting invalid proxy".format(importjob.item_id))
        #                delete_existing_proxy(importjob.item_id, shape_id)
        #            transcode_proxy(importjob.item_id, "lowres")
        #        else:
        #            logger.info("{0}: Proxy is OK".format(importjob.item_id))
        #    except Exception as e:
        #        logger.exception("{0}: Could not do proxy check: ", exc_info=e)
        #        inform_sentry_exception()
        #importjob.save()

