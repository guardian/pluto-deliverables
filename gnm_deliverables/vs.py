from __future__ import unicode_literals

import json
import logging
import os
from urllib import pathname2url
from lxml import etree as ET


from portal.plugins.gnm_misc_utils.helpers import parse_xml
from portal.plugins.gnm_vidispine_errors.error_handling import is_error, raise_error, log_vs_error_from_resp
from portal.plugins.gnm_vidispine_utils import vs_calls
from portal.plugins.gnm_vidispine_utils.md_utils import E, tag
from portal.plugins.gnm_asset_folder.tasks import _run_helper_script

logger = logging.getLogger(__name__)


def vidispine_escape(path):
    if not path:
        return ''
    return pathname2url(pathname2url(path))


def create_placeholder_item(user, metadata):
    resp = vs_calls.post('import/placeholder?container=1', data=ET.tostring(metadata), username=user.username)
    if is_error(resp.status_code):
        raise_error(resp)
    xml = parse_xml(resp.content)
    return xml.attrib.get('id')


def add_to_collection(user, collection_id, item_id):
    url = 'collection/{collection_id}/{item_id}?type=item'.format(collection_id=collection_id, item_id=item_id)
    resp = vs_calls.put(url, '', user.username)
    if is_error(resp.status_code):
        log_vs_error_from_resp(resp)
        return False
    return True


def create_import_job(user, absolute_path, item_id):
    logger.info('Taking ownership of {file} by running helper script. Users should still have access via the gid'.format(file=absolute_path))
    dir_name = os.path.dirname(absolute_path)
    _run_helper_script(dir_name, None, True, override_owner=os.getuid())

    open(absolute_path, 'rb')

    file_uri = 'file://{url}'.format(url=vidispine_escape(absolute_path))
    jobmetadata = "portal_groups:StringArray%3D{groups}".format(groups=user.get_profile().default_ingest_group.name)
    url = 'item/{item_id}/shape/essence?uri={file_uri}&jobmetadata={jobmetadata}&priority=HIGH'.format(
        item_id=item_id,
        jobmetadata=jobmetadata,
        file_uri=file_uri
    )
    resp = vs_calls.post(url, data=None, username=user.username)
    logger.info(url)
    if is_error(resp.status_code):
        raise_error(resp)
    xml = parse_xml(resp.content)
    return xml.find(tag('jobId')).text


def get_job(user, job_id):
    resp = vs_calls.get('job/{job_id}'.format(job_id=job_id), username=user.username, accept='application/json')
    if is_error(resp.status_code):
        raise_error(resp)
    return json.loads(resp.content)


def get_item(user, item_id):
    resp = vs_calls.get('item/{item_id}?content=shape,metadata&methodType=AUTO'.format(
        item_id=item_id), username=user.username, accept='application/json')
    if is_error(resp.status_code):
        raise_error(resp)
    return json.loads(resp.content)


def metadata_subdocument_from_dict(md_dict):
    elements = []
    for key, value in md_dict.iteritems():
        if isinstance(value, dict):
            e = metadata_subdocument_from_dict(value)
            e = E.group(E.name(key), *e)
        else:
            if isinstance(value, list):
                e = [E.value(v) for v in value]
            else:
                e = [E.value(value)]
            e = E.field(E.name(key), *e)
        elements.append(e)
    return elements


def metadata_document_from_dict(md_dict, md_group):
    elements = metadata_subdocument_from_dict(md_dict)
    return E.MetadataDocument(E.group(md_group), E.timespan(*elements, end='+INF', start='-INF'))


def set_item_metadata(user, item_id, metadata):
    resp = vs_calls.put('item/{item_id}/metadata'.format(
        item_id=item_id), data=ET.tostring(metadata), username=user.username, accept='application/json')
    if is_error(resp.status_code):
        raise_error(resp)
    return json.loads(resp.content)


def delete_item(user, item_id):
    resp = vs_calls.delete('item/{item_id}'.format(item_id=item_id), username=user.username)
    if is_error(resp.status_code):
        raise_error(resp)
    return True
