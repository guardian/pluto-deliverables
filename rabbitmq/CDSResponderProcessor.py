from .MessageProcessor import MessageProcessor
from gnm_deliverables.models import DeliverableAsset, Mainstream, DailyMotion
import logging
from .serializers import CDSMessageSerializer
from .models import CDSResponderMessage
from gnm_deliverables.settings import CDS_ROUTE_MAP

logger = logging.getLogger(__name__)


def get_mainstream_record(asset_id: int) -> Mainstream:
    asset = DeliverableAsset.objects.get(id=asset_id)
    return asset.mainstream_master


def get_dailymotion_record(asset_id: int) -> DailyMotion:
    asset = DeliverableAsset.objects.get(id=asset_id)
    return asset.DailyMotion_master


def get_route_mapping(routename: str) -> str:
    return list(CDS_ROUTE_MAP.keys())[list(CDS_ROUTE_MAP.values()).index(routename)]


def set_asset_data(routename, asset, job_id=None, upload_status=None):
    try:
        route_mapping = get_route_mapping(routename)
        if route_mapping == 'mainstream':
            mainstream = get_mainstream_record(asset)
            logger.info(mainstream.__dict__)
            if job_id is not None:
                mainstream.job_id = job_id
            if upload_status is not None:
                mainstream.upload_status = upload_status
            mainstream.save()
            logger.info(mainstream.__dict__)
        elif route_mapping == 'dailymotion':
            dailymotion = get_dailymotion_record(asset)
            if job_id is not None:
                dailymotion.job_id = job_id
            if upload_status is not None:
                dailymotion.upload_status = upload_status
            dailymotion.save()
    except DeliverableAsset.DoesNotExist:
        return Exception


class CDSResponderProcessor(MessageProcessor):
    routing_key = "cds.job.started"
    serializer = CDSMessageSerializer

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        try:
            msg = CDSResponderMessage(**body)
            logger.info(msg.__dict__)
            set_asset_data(msg.routename, int(msg.deliverable_asset), job_id=msg.job_name)
        except Exception:
            return Exception


class CDSInvalidProcessor(MessageProcessor):
    routing_key = "cds.job.invalid"
    serializer = CDSMessageSerializer

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        try:
            msg = CDSResponderMessage(**body)
            set_asset_data(msg.routename, int(msg.deliverable_asset), upload_status='Upload Failed')
        except Exception:
            return Exception
