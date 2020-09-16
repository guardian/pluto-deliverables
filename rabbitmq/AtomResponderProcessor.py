from .MessageProcessor import MessageProcessor
from .serializers import AtomMessageSerializer
from .models import AtomResponderMessage
from gnm_deliverables.models import Deliverable, DeliverableAsset
import gnm_deliverables.choices as AssetChoices
import rabbitmq.constants as const
import logging

logger = logging.getLogger(__name__)


class AtomResponderProcessor(MessageProcessor):
    routing_key = "atomresponder.atom.#"
    serializer = AtomMessageSerializer

    def get_or_create_record(self, vsid, atomid, projectid) -> DeliverableAsset:
        """
        tries to look up a pre-existing asset with the same atom id.
        if that can't be found, tries to find a Deliverable bundle for the given project
        if that can't be found, then
        :param vsid:
        :param atomid:
        :param projectid:
        :return:
        """
        try:
            asset = DeliverableAsset.objects.get(atom_id=atomid)
            logger.info("Found pre-existing asset id {} for atom id {}".format(asset.pk, atomid))
            return asset
        except DeliverableAsset.DoesNotExist:
            pass

        ##if we get here, there is no DeliverableAsset attached to the given id
        logger.info("No pre-existing asset for atom id {}, creating one".format(atomid))

        try:
            bundle = Deliverable.objects.get(pluto_core_project_id=projectid)
        except Deliverable.DoesNotExist:
            bundle = Deliverable(
                commission_id=-1,   #this is a "special value". pluto-core should be notified when the object is created and update this value
                pluto_core_project_id=projectid,
                name="Deliverables for {}".format(projectid)
            )
            bundle.save()

        asset = DeliverableAsset(
            type=AssetChoices.DELIVERABLE_ASSET_TYPE_VIDEO_FULL_MASTER,
            atomid=atomid,
            deliverable=bundle
        )
        return asset

    def valid_message_receive(self, exchange_name, routing_key, delivery_tag, body):
        """
        handles the incoming message
        :param exchange_name:
        :param routing_key:
        :param delivery_tag:
        :param body:
        :return:
        """
        msg = AtomResponderMessage(**body)

        if msg.type == const.MESSAGE_TYPE_MEDIA:
            logger.info("Received notification of a new master {0} at item {1}".format(msg.title, msg.itemId))

        elif msg.type == const.MESSAGE_TYPE_PAC:
            pass
        elif msg.type == const.MESSAGE_TYPE_PROJECT_ASSIGNED:
            pass
        elif msg.type == const.MESSAGE_TYPE_RESYNC_MEDIA:
            pass
        else:
            raise ValueError("Did not recognise message type {}".format(msg.type))