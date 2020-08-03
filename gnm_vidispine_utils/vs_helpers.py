from django.http import HttpRequest
from portal.plugins.gnm_misc_utils.helpers import parse_xml
from portal.plugins.gnm_vidispine_errors.error_handling import is_error, raise_error
from portal.plugins.gnm_vidispine_utils import constants as const
from portal.plugins.gnm_vidispine_utils import md_utils
from portal.plugins.gnm_vidispine_utils.md_utils import tag
from .vs_calls import get
from sys import _getframe
import logging
from os import environ

logger = logging.getLogger(__name__)


def get_metadata_group(groupname):
    resp = get('metadata-field/field-group/{groupname}'.format(groupname=groupname), username='admin')

    if is_error(resp.status_code):
        # Raise appropriate exception
        raise_error(resp)
    metadatagroup = parse_xml(resp.content)
    return metadatagroup


def get_metadata_elements(groupname):
    resp = get('metadata;group={groupname}'.format(groupname=groupname), username='admin')

    if is_error(resp.status_code):
        # raise_error(resp)
        logger.error('Failed to load metadata elements: {group}'.format(group=groupname))
    md = parse_xml(resp.content)
    return md


def resolve_working_group(uuid):
    for wg in working_groups:
        if wg['uuid'] == uuid:
            return wg['name']
    return ''


def get_working_group_by_name(name):
    for wg in working_groups:
        if wg['name'] == name:
            return wg['uuid']
    return ''


def resolve_project_type(uuid):
    for pt in project_types:
        if pt['uuid'] == uuid:
            return pt['name']
    return ''


def get_project_type_by_name(name):
    for pt in project_types:
        if pt['name'] == name:
            return pt['uuid']
    return ''


def resolve_project_sub_type(uuid):
    for pt in project_sub_types:
        if pt['uuid'] == uuid:
            return pt['name']
    return ''


def resolve_commissioner(uuid):
    for c in commissioners:
        if c['uuid'] == uuid:
            return c['name']
    return ''

def _fetch_commissioners():
    commissioners = []
    elements = get_metadata_elements('Commissioner')
    for group in elements.findall(tag('group')):
        commissioners.append({
            'name': md_utils.get_field_value(group, const.GNM_SUBGROUP_DISPLAYNAME),
            'workinggroup': md_utils.get_field_value(group, const.GNM_COMMISSIONER_WORKINGGROUP),
            'uuid': group.attrib.get('uuid', ''),
            })
    logger.info('Fetched commissioners: {commissioners}'.format(commissioners=commissioners))
    return commissioners


def _fetch_working_groups():
    working_groups = []
    elements = get_metadata_elements(const.GNM_WORKINGGROUP_TYPE)
    for group in elements.findall(tag('group')):
        working_groups.append({
            'name': md_utils.get_field_value(group, const.GNM_SUBGROUP_DISPLAYNAME),
            'uuid': group.attrib.get('uuid', ''),
            'hide': md_utils.get_field_value(group, 'gnm_workinggroup_hide'),
        })
    sorted_list = sorted(working_groups, key=lambda x: x['name'])
    logger.info('Fetched workinggroups: {groups}'.format(groups=sorted_list))
    return sorted_list


def _fetch_project_types():
    project_types = []
    elements = get_metadata_elements(const.GNM_PROJECTTYPE_TYPE)
    for group in elements.findall(tag('group')):
        project_types.append({
            'name': md_utils.get_field_value(group, const.GNM_SUBGROUP_DISPLAYNAME),
            'uuid': group.attrib.get('uuid', ''),
        })
    sorted_list = sorted(project_types, key=lambda x: x['name'])
    logger.info('Fetched project types: {types}'.format(types=sorted_list))
    return sorted_list


def _fetch_project_sub_types():
    project_sub_types = []
    elements = get_metadata_elements(const.GNM_PROJECTSUBTYPE_TYPE)
    for group in elements.findall(tag('group')):
        project_sub_types.append({
            'name': md_utils.get_field_value(group, const.GNM_SUBGROUP_DISPLAYNAME),
            'parent_type': md_utils.get_field_value(group, const.GNM_PROJECTSUBTYPE_PARENTTYPE),
            'uuid': group.attrib.get('uuid', ''),
        })
    sorted_list = sorted(project_sub_types, key=lambda x: x['name'])
    logger.info('Fetched project sub-types: {types}'.format(types=sorted_list))
    return sorted_list


def _fetch_site_id():
    resp = get('storage', username='admin')
    if is_error(resp.status_code):
        raise_error(resp)
    v = parse_xml(resp.content)
    for s in v.iter('{http://xml.vidispine.com/schema/vidispine}id'):
        if not s.text:
            continue
        elif '-' in s.text:
            return s.text.rsplit('-', 1)[0]
        return s.text
    logger.warn('Failed to find siteId')
    return 'VX'


def get_vsobject_or_404(vsclass, id, user):
    '''
    Will attempt to create an instance of a VSModel class with given id.
    If it fails Http404 will be raised.

    Keyword arguments:
        vsclass -- VSModel subclass
        id -- Id of object to fetch

    Returns:
        Object with supplied ID.

    Raises:
        djang.http.Http404 -- If failing to retrieve object with given id.
    '''
    from django.http import Http404
    if id is None or id == "":
        raise Http404

    # TODO describe / document what happens when a user does not have permissions but hte item exists.
    return vsclass(id, user)


def get_request_object():
    """
    Find the current django HttpRequest.
    Useful for e.g. retrieving the user who initiated the request.
    NOTE!!! Will only work if called from code that in turn has
    been called from a django view.
    """
    f = _getframe()
    while f:
        r = f.f_locals.get('request')
        if isinstance(r, HttpRequest):
            return r
        f = f.f_back
    logger.warn('get_request_object() failed')


def get_requesting_user(anonymous=False):
    """
    Convenience method for retrieving the current user, if any.
    """
    r = get_request_object()
    if r and r.user and (anonymous or r.user.is_authenticated()):
        return r.user


def runas_user(user, anonymous=False):
    """
    Convenience method for retrieving the current user when user is None.
    Throws exception if no current user could be found.
    """
    if not user:
        user = get_requesting_user(anonymous)
        if not user:
            raise Exception('No user')
    return user

# Global cache of things we do not want to fetch for every request
# The server must be restarted if these change
if not 'CI' in environ:
    working_groups = _fetch_working_groups()
    project_types = _fetch_project_types()
    project_sub_types = _fetch_project_sub_types()
    commissioners = _fetch_commissioners()
    site_id = _fetch_site_id()
else:
    site_id = "VX"
