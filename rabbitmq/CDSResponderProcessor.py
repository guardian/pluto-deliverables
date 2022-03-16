from .MessageProcessor import MessageProcessor
from gnm_deliverables.models import DeliverableAsset, Mainstream, DailyMotion
import logging
from .serializers import CDSMessageSerializer
from .models import CDSResponderMessage
from gnm_deliverables.settings import CDS_ROUTE_MAP

logger = logging.getLogger(__name__)


def get_mainstream_record(asset_id: int) -> Mainstream:
    try:
        asset = DeliverableAsset.objects.get(id=asset_id)
        return asset.mainstream_master
    except DeliverableAsset.DoesNotExist:
        pass


def get_dailymotion_record(asset_id: int) -> DailyMotion:
    try:
        asset = DeliverableAsset.objects.get(id=asset_id)
        return asset.DailyMotion_master
    except DeliverableAsset.DoesNotExist:
        pass


def get_route_mapping(routename: str) -> str:
    return list(CDS_ROUTE_MAP.keys())[list(CDS_ROUTE_MAP.values()).index(routename)]


class CDSResponderProcessor(MessageProcessor):
    routing_key = "cds.job.started"
    serializer = CDSMessageSerializer

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        msg = CDSResponderMessage(**body)
        route_mapping = get_route_mapping(msg.routename)
        if route_mapping == 'mainstream':
            mainstream = get_mainstream_record(int(msg.deliverable_asset))
            mainstream.routename = msg.routename
            mainstream.job_id = msg.job_name
            mainstream.save()
        if route_mapping == 'dailymotion':
            dailymotion = get_dailymotion_record(int(msg.deliverable_asset))
            dailymotion.routename = msg.routename
            dailymotion.job_id = msg.job_name
            dailymotion.save()


class CDSInvalidProcessor(MessageProcessor):
    routing_key = "cds.job.invalid"
    serializer = CDSMessageSerializer

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        msg = CDSResponderMessage(**body)
        route_mapping = get_route_mapping(msg.routename)
        if route_mapping == 'mainstream':
            mainstream = get_mainstream_record(int(msg.deliverable_asset))
            mainstream.upload_status = 'Upload Failed'
            mainstream.save()
        if route_mapping == 'dailymotion':
            dailymotion = get_dailymotion_record(int(msg.deliverable_asset))
            dailymotion.upload_status = 'Upload Failed'
            dailymotion.save()


