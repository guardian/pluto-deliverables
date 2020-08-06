from django.conf import settings
import os
from portal.plugins.gnm_vidispine_utils.md_utils import E
from portal.plugins.gnm_vidispine_utils import constants as const
from portal.plugins.gnm_vidispine_errors.error_handling import is_error, log_vs_error_from_resp, raise_error
import logging
import xml.etree.cElementTree as ET
from time import sleep

log = logging.getLogger(__name__)

CHUNKSIZE=1024


def update_edl_data(f, master_id, user, retries=10, retry_delay=3):
    """
    updates the EDL data contained for a given master
    :param f: a readable, supporting .chunks(), of the incoming data
    :param master_id: master ID to update
    :param user: django user object representing the user carrying out this operation
    :return: celery task id of the update task
    """
    from portal.plugins.gnm_vidispine_utils import vs_calls
    from portal.plugins.gnm_masters.tasks import update_pacdata

    log.info("New PAC data incoming for {0}".format(master_id))
    filename = 'master_{master}_edldata.xml'.format(master=master_id)
    folder = getattr(settings, 'MASTER_INGEST_EDL_XML_TEMP_PATH', '/var/tmp/')
    path = os.path.join(folder, filename)
    log.info("Writing pac data for {0} to {1}".format(master_id, path))

    with open(path, 'wb+') as destination:
        if hasattr(f, "chunks"): #django uploaded file has this attrib
            for chunk in f.chunks():
                destination.write(chunk)
        else:
            while True:
                data = f.read(CHUNKSIZE)
                if len(data)==0:
                    break
                destination.write(data)

    log.info("Updating item pac status on {0} to {1}".format(master_id, const.PACMAN_PROCESSING))

    md = E.MetadataDocument(
        E.timespan(
            E.field(
                E.name(const.GNM_MASTERS_GENERIC_PACDATA_STAUS),
                E.value(const.PACMAN_PROCESSING),
            ), end='+INF', start='-INF'
        )
    )

    attempt=0
    while True:
        attempt+=1
        resp = vs_calls.put('item/{id}/metadata'.format(id=master_id), ET.tostring(md), user)
        if not is_error(resp.status_code): break
        if attempt>retries:
            log.error("Unable to update metadata on master {id} after {retries} attempts, giving up".format(id=master_id, retries=retries))
            raise_error(resp)
        log.error("Unable to update metadata on master {id}. Retrying...")
        sleep(retry_delay)

    log.info("Triggering background processing task for {0} as {1}".format(master_id, str(user)))

    result = update_pacdata.delay(path, master_id, user)
    log.info("Task ID for PAC processing of {0} is {1}".format(master_id, result.id))

    return result.id