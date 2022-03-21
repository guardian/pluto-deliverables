from .MessageProcessor import MessageProcessor
from gnm_deliverables.models import DeliverableAsset, Mainstream, DailyMotion
import logging
from .serializers import CDSMessageSerializer
from .models import CDSResponderMessage
from gnm_deliverables.settings import CDS_ROUTE_MAP
from exceptions import PermanentFailure

logger = logging.getLogger(__name__)


def get_mainstream_record(asset_id: int) -> Mainstream:
    asset = DeliverableAsset.objects.get(id=asset_id)
    return asset.mainstream_master


def get_dailymotion_record(asset_id: int) -> DailyMotion:
    asset = DeliverableAsset.objects.get(id=asset_id)
    return asset.DailyMotion_master


def get_route_mapping(routename: str) -> str:
    """
    Get the correct route mapping to use by looking for the route name in the CDS_ROUTE_MAP dictionary from the settings file
    :param routename: The routename to look up
    :return: The string of the key name in the CDS_ROUTE_MAP dictionary
    """
    return list(CDS_ROUTE_MAP.keys())[list(CDS_ROUTE_MAP.values()).index(routename)]


def set_asset_data(routename, asset, job_id=None, upload_status=None):
    """
    Set data for asset on the correct route model if job_id and upload_status as present
    :param routename: The routename to use to load the correct model
    :param asset: The number of the asset
    :param job_id: Optional job id. to set
    :param upload_status: Optional upload status to set
    :return:
    """
    try:
        route_mapping = get_route_mapping(routename)
        if route_mapping == 'mainstream':
            mainstream = get_mainstream_record(asset)
            if job_id is not None:
                mainstream.job_id = job_id
            if upload_status is not None:
                mainstream.upload_status = upload_status
            mainstream.save()
        elif route_mapping == 'dailymotion':
            dailymotion = get_dailymotion_record(asset)
            if job_id is not None:
                dailymotion.job_id = job_id
            if upload_status is not None:
                dailymotion.upload_status = upload_status
            dailymotion.save()
    except DeliverableAsset.DoesNotExist:
        raise PermanentFailure


class CDSResponderProcessor(MessageProcessor):
    routing_key = "cds.job.started"
    serializer = CDSMessageSerializer

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        msg = CDSResponderMessage(**body)
        set_asset_data(msg.routename, int(msg.deliverable_asset), job_id=msg.job_name)


class CDSInvalidProcessor(MessageProcessor):
    routing_key = "cds.job.invalid"
    serializer = CDSMessageSerializer

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        msg = CDSResponderMessage(**body)
        set_asset_data(msg.routename, int(msg.deliverable_asset), upload_status='Upload Failed')
