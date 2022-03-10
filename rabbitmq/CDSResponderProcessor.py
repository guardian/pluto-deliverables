from .MessageProcessor import MessageProcessor
from gnm_deliverables.models import DeliverableAsset, Mainstream, DailyMotion
import logging
from .serializers import CDSMessageSerializer
from .models import CDSResponderMessage

logger = logging.getLogger(__name__)


class CDSResponderProcessor(MessageProcessor):
    routing_key = "cds.job.started"
    serializer = CDSMessageSerializer

    def get_mainstream_record(self, asset_id: int) -> Mainstream:
        try:
            asset = DeliverableAsset.objects.get(id=asset_id)
            return asset.mainstream_master
        except DeliverableAsset.DoesNotExist:
            pass

    def get_dailymotion_record(self, asset_id: int) -> DailyMotion:
        try:
            asset = DeliverableAsset.objects.get(id=asset_id)
            return asset.DailyMotion_master
        except DeliverableAsset.DoesNotExist:
            pass

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        msg = CDSResponderMessage(**body)
        logger.info(msg.__dict__)
        if msg.routename == 'MainstreamMedia.xml':
            logger.info(msg.deliverable_asset)
            mainstream = self.get_mainstream_record(int(msg.deliverable_asset))
            logger.info(mainstream.__dict__)
            mainstream.routename = msg.routename
            mainstream.job_id = msg.job_name
            mainstream.save()
            logger.info(mainstream.__dict__)
        if msg.routename == 'DailyMotion.xml':
            dailymotion = self.get_dailymotion_record(int(msg.deliverable_asset))
            dailymotion.routename = msg.routename
            dailymotion.job_id = msg.job_name
            dailymotion.save()



