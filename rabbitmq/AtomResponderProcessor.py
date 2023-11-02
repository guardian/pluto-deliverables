from .MessageProcessor import MessageProcessor
from .serializers import AtomMessageSerializer
from .models import AtomResponderMessage
from gnm_deliverables.models import Deliverable, DeliverableAsset
from gnmvidispine.vs_item import VSItem
from django.conf import settings
import gnm_deliverables.choices as AssetChoices
import rabbitmq.constants as const
import logging
import pytz
from datetime import datetime

logger = logging.getLogger(__name__)


class AtomResponderProcessor(MessageProcessor):
    routing_key = "atomresponder.atom.#"
    serializer = AtomMessageSerializer

    def get_or_create_bundle(self, projectid: str, commissionId:int) -> Deliverable:
        """
        Looks up a deliverable bundle for the given (pluto-core) projectID. If none is found
        then a new one is created for the given project and commission IDs
        :param projectid: project ID to create a bundle for
        :param commissionId: commission relating to that project. Only used when creating a new bundle.
        :return: a Deliverable model instance
        """
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

    def get_or_create_unattached_bundle(self) -> Deliverable:
        """
        Gets the special bundle for unattached projects, or creates it if it does not exist
        :return: a Deliverable model instance
        """
        try:
            bundle = Deliverable.objects.get(pluto_core_project_id=-1)
        except Deliverable.DoesNotExist:
            bundle = Deliverable(
                commission_id=-1,
                pluto_core_project_id=-1,
                name="Unattached media atom masters"
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

        if projectid is None:
            bundle = self.get_or_create_unattached_bundle()
        else:
            bundle = self.get_or_create_bundle(projectid, commissionId)

        timezone = pytz.timezone("UTC")
        timestamp = timezone.localize(datetime.now()).isoformat()

        asset = DeliverableAsset(
            type=AssetChoices.DELIVERABLE_ASSET_TYPE_VIDEO_PUBLISHED_ATOM_FILE,
            atom_id=atomid,
            deliverable=bundle,
            changed_dt=timestamp,
        )
        return asset, True

    def reassign_project(self, asset:DeliverableAsset, projectId:str, commissionId:int):
        logger.info("Reassigning project of {} to id {}".format(str(asset), projectId))
        new_bundle = self.get_or_create_bundle(projectId, commissionId)
        asset.deliverable = new_bundle
        asset.save()

    def set_vs_metadata(self, asset:DeliverableAsset):
        if asset.online_item_id is None:
            logger.info("Deliverable asset {} has no online item id, can't set metadata".format(str(asset)))
            return

        logger.info("Setting deliverables metadata on {0} for {1}".format(asset.online_item_id, str(asset)))
        item = VSItem(url=settings.VIDISPINE_URL,user=settings.VIDISPINE_USER,passwd=settings.VIDISPINE_PASSWORD)
        item.name = asset.online_item_id
        builder = item.get_metadata_builder()
        builder.addGroup(const.GROUP_GNM_DELIVERABLE, {
            const.GNM_DELIVERABLE_ATOM_ID: asset.atom_id,
            const.GNM_DELIVERABLE_BUNDLE: asset.deliverable.id,
            const.GNM_DELIVERABLE_ID: asset.id
        })
        builder.commit()

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
            logger.info("Received notification of a master {0} at item {1}".format(msg.title, msg.itemId))
            (asset, created) = self.get_or_create_record(msg.atomId, msg.projectId, msg.commissionId)
            asset.online_item_id = msg.itemId
            asset.job_id = msg.jobId    ##once we save this value, we can process the notifications when the job completes
            asset.size = msg.size
            asset.filename = msg.title
            if created:
                asset.status = AssetChoices.DELIVERABLE_ASSET_STATUS_INGESTING  #FIXME: it might not be this state?
            asset.save()
            if created:
                try:
                    self.set_vs_metadata(asset)
                except Exception as e:
                    logger.exception("Could not update Vidispne metadata on {}: ".format(asset.online_item_id), exc_info=e)
        elif msg.type == const.MESSAGE_TYPE_PAC:
            logger.info("PAC messages not implemented yet")
        elif msg.type == const.MESSAGE_TYPE_PROJECT_ASSIGNED:
            (asset, created) = self.get_or_create_record(msg.atomId, msg.projectId, msg.commissionId)
            if created:
                logger.warning("Strange, got a project re-assignment message for something that does not exist yet")
            self.reassign_project(asset, msg.projectId, msg.commissionId)
        else:
            raise ValueError("Did not recognise message type {}".format(msg.type))