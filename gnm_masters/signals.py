import django.dispatch
import logging
import re
from portal.plugins.gnm_misc_utils.helpers import get_admin_user

vsid_regex = re.compile(r'^(?P<site>\w{2})-(?P<numeric>\d+)')
logger = logging.getLogger(__name__)

post_create_master = django.dispatch.Signal(providing_args=['master_model', 'vs_master'])

master_external_update = django.dispatch.Signal(providing_args=['item_id','project_id'])


@django.dispatch.receiver(master_external_update)
def handle_external_update(sender, **kwargs):
    """
    Update the data model in response to a signal indicating something has updated vidispine
    :param sender:
    :param kwargs:
    :return:
    """
    from portal.plugins.gnm_projects.models import ProjectModel
    from .models import MasterModel, VSMaster
    if 'item_id' not in kwargs:
        logger.error("received project_external_update from {0} but got no vidispine master id".format(sender))
        return False

    if 'project_id' not in kwargs:
        logger.warning("received project_external_update from {0} for {1} but got no vidispine project id".format(sender, kwargs['item_id']))
        project_id=None
    else:
        project_id = vsid_regex.match(kwargs['project_id'])
        if project_id is None:
            logger.warning("{0} does not appear to be a valid project ID".format(kwargs['project_id']))

    logger.info("Received external update notification for master {0}".format(kwargs['item_id']))
    id_parts = vsid_regex.match(kwargs['item_id'])
    if not id_parts:
        logger.error("{0} is not a valid item id".format(kwargs['item_id']))
        raise ValueError("{0} is not a valid item id".format(kwargs['item_id']))

    vs_master = VSMaster(kwargs['item_id'],user=get_admin_user())
    try:
        logger.info("Updating existing master record for {0}".format(kwargs['item_id']))
        master_model = MasterModel.objects.get(item_id=id_parts.group('numeric'))
        master_model.update_from_master(vs_master)
        if project_id is not None:
            try:
                logger.info("Attaching master record to project {0} via numeric part {1}".format(project_id.group(0), project_id.group("numeric")))
                master_model.project = ProjectModel.objects.get(collection_id=project_id.group("numeric"))
            except ProjectModel.DoesNotExist:
                logger.warning("Project {0} does not appear to exist".format(project_id.group(0)))
            else:
                logger.warning("{0}: No project_id was passed", kwargs['item_id'])
        master_model.save()
        logger.info("Master update for {0} is completed".format(kwargs['item_id']))
        return True
    except MasterModel.DoesNotExist:
        logger.info("Creating new master record for {0}".format(kwargs['item_id']))
        (master_model, created) = MasterModel.get_or_create_from_master(vs_master,user=get_admin_user())
        master_model.save()
        logger.info("Master record has been created for {0}".format(kwargs['item_id']))
        return True