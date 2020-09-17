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

    def get_or_create_bundle(self, projectid: str, commissionId:int) -> Deliverable:
        try:
            bundle = Deliverable.objects.get(pluto_core_project_id=int(projectid))
        except ValueError:
            logger.error("ProjectId {} is not a number. Maybe it's a Vidispine project?".format(projectid))
            raise RuntimeError("Invalid project id")
        except Deliverable.DoesNotExist:
            bundle = Deliverable(
                commission_id=commissionId,
                pluto_core_project_id=projectid,
                name="Deliverables for {}".format(projectid)
            )
            bundle.save()
        return bundle

    def get_or_create_record(self, atomid:str, projectid:str, commissionId:int) -> (DeliverableAsset, bool):
        """
        tries to look up a pre-existing asset with the same atom id.
        if that can't be found, tries to find a Deliverable bundle for the given project
        if that can't be found, then it creates a deliverable bundle from the provided information and saves it to the db
        once a bundle is available, it creates a new DeliverableAsset and returns it WITHOUT saving
        :param atomid: the atom uuid
        :param projectid: (string representation of) the numeric projectlocker project id
        :param commissionId: the numeric commission id
        :return: a DeliverableAsset
        """
        try:
            asset = DeliverableAsset.objects.get(atom_id=atomid)
            logger.info("Found pre-existing asset id {} for atom id {}".format(asset.pk, atomid))
            return asset, False
        except DeliverableAsset.DoesNotExist:
            pass

        ##if we get here, there is no DeliverableAsset attached to the given id
        logger.info("No pre-existing asset for atom id {}, creating one".format(atomid))

        bundle = self.get_or_create_bundle(projectid, commissionId)

        asset = DeliverableAsset(
            type=AssetChoices.DELIVERABLE_ASSET_TYPE_VIDEO_FULL_MASTER,
            atom_id=atomid,
            deliverable=bundle,
        )
        return asset, True

    def reassign_project(self, asset:DeliverableAsset, projectId:str, commissionId:int):
        logger.info("Reassigning project of {} to id {}", str(asset), projectId)
        new_bundle = self.get_or_create_bundle(projectId, commissionId)
        asset.deliverable = new_bundle
        asset.save()

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

        if msg.type == const.MESSAGE_TYPE_MEDIA or msg.type == const.MESSAGE_TYPE_RESYNC_MEDIA:
            logger.info("Received notification of a new master {0} at item {1}".format(msg.title, msg.itemId))
            (asset, created) = self.get_or_create_record(msg.atomId, msg.projectId, msg.commissionId)
            asset.online_item_id = msg.itemId
            asset.job_id = msg.jobId    ##once we save, we will get the notifications when the job completes
            asset.size = msg.size
            asset.filename = msg.title
            if created:
                asset.status = AssetChoices.DELIVERABLE_ASSET_STATUS_INGESTING  #FIXME: it might not be this state?
            asset.save()
        elif msg.type == const.MESSAGE_TYPE_PAC:
            logger.info("PAC messages not implemented yet")
        elif msg.type == const.MESSAGE_TYPE_PROJECT_ASSIGNED:
            (asset, created) = self.get_or_create_record(msg.atomId, msg.projectId, msg.commissionId)
            if created:
                logger.warning("Strange, got a project re-assignment message for something that does not exist yet")
            self.reassign_project(asset, msg.projectId, msg.commissionId)
        else:
            raise ValueError("Did not recognise message type {}".format(msg.type))