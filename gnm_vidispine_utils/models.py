from copy import deepcopy
import dateutil.parser
from django.core.cache import cache
from django.db.models.signals import pre_save, post_save
from django.utils.datastructures import SortedDict
from django.utils.dateparse import parse_datetime
import hashlib
from requests import Response
from portal.plugins.gnm_misc_utils.helpers import parse_xml
from portal.plugins.gnm_vidispine_utils.md_utils import tag, E
from portal.plugins.gnm_vidispine_utils import md_utils
from portal.plugins.gnm_vidispine_utils import vs_calls
from portal.plugins.gnm_vidispine_utils import constants as vs_const
from portal.plugins.gnm_vidispine_errors.error_handling import is_error, raise_error
from django.utils import formats
from datetime import datetime
from lxml import etree as ET
import math, pytz


import logging
logger = logging.getLogger(__name__)


class Value(object):

    def __init__(self, value, uuid, timestamp=None, user=None):
        self.value = value
        self.uuid = uuid
        if timestamp is not None:
            self.timestamp = dateutil.parser.parse(timestamp)
        else:
            self.timestamp = None
        self.user = user

    def __str__(self):
        return str(self.value)

    def __unicode__(self):
        return str(self.value)

    def __repr__(self):
        if self.value is None:
            return 'Value(None)'
        return 'Value(' + str(self.value) + ')'

    def __eq__(self, other):
        if isinstance(other, Value):
            return self.value == other.value
        return self.value == other

    def __ne__(self, other):
        return not self.__eq__(other)


class Reference(object):

    def __init__(self, name, uuid):
        self.name = name
        self.uuid = uuid

    def __repr__(self):
        return 'Reference(' + self.name + ': ' + self.uuid + ')'


class Field(object):
    """
    Field behaves like a list except it has extras.
    If it contains only one item it behaves like a single item.
    .values() is a list of contained values
    .uuids() is a list of contained uuids
    """
    def __init__(self, values):
        self._values = values

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._values[key]
        for x in self._values:
            if x.uuid == key:
                return x

    def __iter__(self):
        for x in self._values:
            yield x

    def __str__(self):
        return str(list(self))

    def __unicode__(self):
        return str(list(self))

    def __repr__(self):
        return str(self)

    def append(self, value):
        self._values.append(value)

    def values(self):
        return [x.value for x in self._values]

    def uuids(self):
        return [x.uuid for x in self._values]

    def __get__(self, obj, objtype):
        if len(self._values) == 1:
            return self._values[0]
        return self


def metadata_factory(timespan, field_references):
    """
    A factory for VSMetadata classes. This should probably only be used by VSModel.
    """
    fields = SortedDict()

    for field in timespan.findall(tag('field')):
        name = field.find(tag('name')).text
        # Remap name for systemfield to group name.
        if name in list(field_references.keys()):
            name = field_references[name]
        values = []
        for value in field.findall(tag('value')):
            try:
                values.append(Value(value=value.text, uuid=value.attrib.get('uuid', ''), timestamp=value.attrib.get('timestamp', None), user=value.attrib.get('user', None)))
            except UnicodeDecodeError:
                values.append(Value(value='- Parse Error -', uuid=None))

        fields[name] = Field(values)

    return type('VSMetadata', (object, ), fields)


class FakeResponse(object):
    pass


class VSModel(object):
    """
    A Model for interacting with metadata in Vidispine
    Inherit from this class, specify the url like 'collection/{id}/metadata'
    and create instances with YourModel('VX-123')

    The instance will have two fiedls, md_raw and md
    md_raw is the documentElement with the parsed metadataxml
    md is a friendlier representation

    If fields in the metadata are referencing a Vidispine system field, e.g. 'user' these mappings
    are stored in field_references.
    YourModel has a metadata field 'my_title' that references the systemfield 'title' YourModel should
    have the following: field_references =  {'title', 'my_title',}
    """
    url = None
    get_params = None #these parameters are added to the end of any get type request
    field_references = None
    ignore_on_update = None

    def __init__(self, id, user, data=None, md_raw=None, use_cache=False):
        '''
        Create a new object of the given type.

        There are three ways to create this object:
            1. Supply the id only. This will result in missing data getting fetched from Vidispine.
            2. Supply data. This will create an object from the data in the dict. No call to Vidispine will be made,
               even if data did not contain all attributes the class (metadatagroup) has.
            3. Supply a DOM obtained through some Vidispine request. This will create and object from the DOM.
               No call to Vidispine will be made, even if the DOM does not contain all attributes the class (metadatagroup) has.

        Keyword arguments:
            id -- the collection id.
            data -- a dict containing where keys are attributes and values are the attributes values
            md_raw -- Element Tree represention of the model.

        Raises:
            VSHttp404 -- Vidispine returned 404
            VSHttp403 -- Vidispine returned 403
            VSHttpUnexpectedStatus -- Vidispine returned unexpected status code, one that is not handled specifically.
        '''
        assert isinstance(self.url, str)
        assert '{id}' in self.url
        self.id = id
        if self.field_references is None:
            self.field_references = {}

        if self.ignore_on_update is None:
            self.ignore_on_update = []

        self.diff = []
        self.user = user
        self.username = user.username

        if data is not None:
            self.substitute_references(data)
            self.md_raw = self.create_metadata_document(data)
        elif md_raw is not None:
            self.md_raw = md_raw
        else:
            url = self.url.format(id=self.id)
            if self.get_params is not None:
                url = url + self.get_params

            if use_cache:
                key_cleartext = 'vsmodel_' + url + '_' + self.username
                key = hashlib.md5(key_cleartext).hexdigest()
                cached = cache.get(key)
                if cached:
                    resp = FakeResponse()
                    resp.status_code, resp.content = cached
                else:
                    resp = vs_calls.get(url, self.username)
                    cache.set(key, (resp.status_code, resp.content), 60)

                if is_error(resp.status_code):
                    # Raise appropriate exception
                    raise_error(resp)
                self.md_raw = parse_xml(resp.content)

            else:
                resp = vs_calls.get(url, self.username)
                if is_error(resp.status_code):
                    # Raise appropriate exception
                    raise_error(resp)
                self.md_raw = parse_xml(resp.content)

        self._set_md()
        self.validate_type()

    def _set_md(self):
        '''
        Populates the "md" attribute from data stored in "md_raw"
        '''
        inf_timespan = md_utils.get_inf_timespan(self.md_raw)
        self.md = metadata_factory(inf_timespan, self.field_references)

    def validate_type(self):
        '''
        Called after object instatiation.
        If you whish to validate that the correct definition was fetched do so here and if not fail in some suitable way.

        E.g.
        Expecting to get a Vidispine collection with metadata to represent A.
        If the metadata is not representing class A but B instead raise an exception or fail in some graceful fashion.
        '''
        pass

    def get(self, key, default=None):
        '''
        This method is called by django forms when populating fields for an instance supplied via initial.
        E.g.
        form: MyForm
        model: class MyModel(VSModel)
        View code: form = MyForm(initial=MyModel('some-id'))
        Template code: {{ form.my_field }}
        '''
        if hasattr(self.md, key):
            data = getattr(self.md, key)
            if isinstance(data, Value):
                return data.value
            return list(data.values())
        return default

    def getlist(self, key):
        ret = []

        timespan = md_utils.get_inf_timespan(self.md_raw)
        for field in timespan.findall(tag('field')):
            name = field.find(tag('name')).text
            if name == key:

                for value in field.findall(tag('value')):
                    ret.append(value.text)
        return ret

    def get_in(self, keys, default=None):
        for key in keys:
            value = self.get(key, None)
            if value is None:
                continue
            return value
        return default

    def set(self, key, value, uuid=None):
        '''
        Set a metadata attribute to a value.
        '''
        from portal.plugins.gnm_vidispine_utils.models import Value, Field
        new_value = Value(value, uuid)
        setattr(self.md, key, Field(values=[new_value]))
        self.diff.append(key)  # Add the newly set value to the diff so it gets updated on save.

    def append_to(self, key, value, uuid=None):
        '''
        Appends a value to an metadata attribute.

        Since Fields with only one value are not exposed as lists this workaround is needed.

        For larger updates see also update_metadata_values()
        '''
        from portal.plugins.gnm_vidispine_utils.models import Value, Field
        if uuid is None:
            uuid = ''
        new_value = Value(value, uuid)
        values = getattr(self.md, key, None)  # NOTE: This will get the Field containing values, not a regular list!
        if values is None:
            values = [new_value]
            setattr(self.md, key, Field(values=values))
        elif md_utils.is_iterable_sequence(values):
            values.append(new_value)
        else:
            values = [values, new_value]
            setattr(self.md, key, Field(values=values))
        self.diff.append(key)  # Add the newly set value to the diff so it gets updated on save.

    def create_metadata_document(self, data):
        # TODO document this
        '''
        '''
        doc = E.MetadataDocument(
            E.timespan(start='-INF', end='+INF')
        )

        for name in list(data.keys()):
            field = E.field()

            field.append(E.name(name))
            if md_utils.is_iterable_sequence(data[name]):
                for value in data[name]:
                    field.append(E.value(self._data_to_string(value)))
            else:
                field.append(E.value(self._data_to_string(data[name])))

            doc.find(tag('timespan')).append(field)

        return doc

    def _data_to_string(self, value):
        '''
        Conveniencemethod converts a value to a string if it's on another valid, expected, format.

        There will be non-string types that pass this conversion, only applied to objects which are proved to cause errors in practice.
        '''
        from datetime import datetime, date
        if value is None:
            return ''
        if isinstance(value, datetime):
            return value.strftime(vs_const.VS_DATETIMEFORMAT)
        elif isinstance(value, date):
            return value.strftime(vs_const.VS_DATEFORMAT)
        return value

    @staticmethod
    def vs_create(data, user):
        raise NotImplementedError("Implement this method in your class.")

    def vs_delete(self):
        raise NotImplementedError("Implement this method in your class.")

    def vs_set_acl(self, group={}, user={}):
        '''
        Set ACL on item/collection.
        user and group parameters are dictionaries mapping group/user names to access,
        where access is a one of the following strings: READ, WRITE, ALL
        Example: user={'johan_westerlund': 'ALL', 'john_doe': 'WRITE'}, group={'Users': 'READ'}
        '''
        url = self.url
        if url.endswith('/{id}/metadata'):
            url = url[0:-8]
        elif not url.endswith('/'):
            url += '/'
        url = (url + 'access').format(id=self.id)

        success = True
        for k, v in list(user.items()):
            a = '''<?xml version="1.0" encoding="UTF-8"?>
                <AccessControlDocument xmlns="http://xml.vidispine.com/schema/vidispine">
                    <permission>%s</permission>
                    <user>%s</user>
                    <recursive>true</recursive>
                </AccessControlDocument>''' % (v, k)
            #r = vs_calls.post(url, a, self.user.username)
            r = vs_calls.post(url, a, 'admin')
            if is_error(r.status_code):
                success = False
                logger.error('Failed to set ACL on %s' % url)
            else:
                logger.debug('Set ACL on %s' % url)

        for k, v in list(group.items()):
            a = '''<?xml version="1.0" encoding="UTF-8"?>
                <AccessControlDocument xmlns="http://xml.vidispine.com/schema/vidispine">
                    <permission>%s</permission>
                    <group>%s</group>
                    <recursive>true</recursive>
                </AccessControlDocument>''' % (v, k)
            #r = vs_calls.post(url, a, self.user.username)
            r = vs_calls.post(url, a, 'admin')
            if is_error(r.status_code):
                success = False
                logger.error('Failed to set ACL on %s' % url)
            else:
                logger.debug('Set ACL on %s' % url)
        return success

    @classmethod
    def vs_search(cls, criteria=None, user=None, sorting=None, first=None, number=None, fetch_all=False):
        result = cls._perform_search(criteria, user, sorting, first, number)
        if fetch_all:
            if number is None:
                number = 1000  # If we want everything, better do it in fewer calls
            hits = result.hits
            if hits > number:
                pages = int(math.ceil(hits / float(number)))
                for x in range(pages - 1):
                    result.extend(cls._perform_search(criteria, user, sorting, first=x + 1, number=number))
        return result

    @classmethod
    def _perform_search(cls, *args, **kwargs):
        raise NotImplementedError("Implement this method in your class.")

    def vs_save(self, update_metadata=True, create=False):
        '''
        Will save an instance to Vidispine.
        After the save the instance will be updated with all the latest metadata returned from Vidispine unless "update_metadata"
        is set to False.
        '''
        self._update_raw_metadata()
        md_clean = self._clean_md_raw(create=create)
        self.diff = []

        pre_save.send_robust(sender=self.__class__,raw=False,instance=self)

        logger.debug("UNICODE-DEBUG, self.get('gnm_commission_title')" + str(self.get('gnm_commission_title')))
        resp = vs_calls.put(self.url.format(id=self.id), ET.tostring(md_clean), self.username, stream=True)
        if is_error(resp.status_code):
            # Raise appropriate exception
            raise_error(resp)
        if update_metadata:
            self.md_raw = parse_xml(resp.raw)
            self._set_md()

        post_save.send_robust(sender=self.__class__,created=False,raw=False,instance=self)

        from portal.plugins.gnm_commissions.models import VSCommission
        from portal.plugins.gnm_projects.models import VSProject
        from portal.plugins.gnm_masters.models import VSMaster
        if isinstance(self, VSCommission):
            from portal.plugins.gnm_commissions.models import CommissionModel
            m, created = CommissionModel.get_or_create_from_commission(self, self.user)
            if not created:
                m.update_from_commission(self, self.user)
                m.save()
            m.update_owner(self)
        elif isinstance(self, VSProject):
            from portal.plugins.gnm_projects.models import ProjectModel
            try:
                m, created = ProjectModel.get_or_create_from_project(self, self.user)
                if not created:
                    m.update_from_project(self, self.user)
                    m.save()
                m.update_owner(self)
                if m.commission_id is None:
                    pc = self.get_parent_commission()
                    if pc is None:
                        logger.error('Parent commission is None for project %s' % self.id)
                    else:
                        m.commission_id = pc.id.rsplit('-', 1)[1]
                        m.save()
            except Exception as x:
                logger.exception('Failed to save ProjectModel: %s' % x)
        elif isinstance(self, VSMaster):
            from portal.plugins.gnm_masters.models import MasterModel
            try:
                m, created = MasterModel.get_or_create_from_master(self, self.user)
                if not created:
                    m.update_from_master(self, self.user)
                    m.save()
                m.update_owner(self)
                if m.project_id is None:
                    pp = self.get_parent_project()
                    if pp is None:
                        logger.error('Parent project is None for master %s' % self.id)
                    else:
                        m.project_id = pp.id.rsplit('-', 1)[1]
                        m.save()
                        if m.commission_id is None:
                            pc = m.project.get_parent_commission()
                            if pc is None:
                                logger.error('Parent commission is None for master %s' % self.id)
                            else:
                                m.commission_id = pc.id.rsplit('-', 1)[1]
                                m.save()
            except Exception as x:
                logger.exception('Failed to save MasterModel: %s' % x)

    def substitute_references(self, data):
        '''
        If a key in 'data' exists in the 'field_references' attribute the key will be replaced to match the actual field name in the raw metadata xml.
        data - form.cleaned_data dict or equivalent
        '''
        # Flip mapping for easier lookup
        if self.field_references is not None:
            flipped_field_ref = dict((gnm, vs) for vs, gnm in list(self.field_references.items()))
        else:
            flipped_field_ref = {}
        for key in list(flipped_field_ref.keys()):
            # Return None if nothing is found, don't want keyerrors here because indata may not be a complete set of object metadata attributes
            value = data.pop(key, None)
            if value is not None:
                data[flipped_field_ref[key]] = value

    def _add_raw_references(self, references):
        ts = md_utils.get_inf_timespan(self.md_raw)
        for reference in references:
            md_utils.set_reference(ts, reference.name, reference.uuid)

    def _clean_md_raw(self, create):
        '''
        There may be fields that exists in this model that should not be sent to Vidispine.
        This method is called before data is saved and removes such data before it send to Vidispine

        Examples of such data:
            Vidispine system fields - Sending new data to Vidispine cause update to fail.
            Portal database data - Data that exist in this model but is stored in the Portal database and not in Vidispine.
        '''

        doc = E.MetadataDocument()
        ts_copy = deepcopy(md_utils.get_inf_timespan(self.md_raw))
        doc.append(ts_copy)
        md_utils.remove_field(ts_copy, vs_const.VS_COLLECTIONID)
        md_utils.remove_field(ts_copy, vs_const.VS_ITEMID)
        md_utils.remove_field(ts_copy, vs_const.VS_MEDIATYPE)
        md_utils.remove_field(ts_copy, vs_const.VS_SHAPETAG)
        md_utils.remove_field(ts_copy, vs_const.VS_USER)
        md_utils.remove_field(ts_copy, vs_const.VS_CREATED)
        md_utils.remove_field(ts_copy, vs_const.VS_ORIGINAL_FILENAME)
        md_utils.remove_field(ts_copy, vs_const.VS_ORIGINAL_FORMAT)
        md_utils.remove_field(ts_copy, vs_const.VS_ORIGINAL_HEIGHT)
        md_utils.remove_field(ts_copy, vs_const.VS_ORIGINAL_WIDTH)
        md_utils.remove_field(ts_copy, vs_const.VS_ORIGINAL_AUDIO_CODEC)
        md_utils.remove_field(ts_copy, vs_const.VS_ORIGINAL_VIDEO_CODEC)
        md_utils.remove_field(ts_copy, vs_const.VS_DURATION_SECONDS)
        md_utils.remove_field(ts_copy, vs_const.VS_DURATION_TIMECODE)
        md_utils.remove_field(ts_copy, vs_const.VS_MIMETYPE)
        md_utils.remove_fields_starting_with(ts_copy, '__')

        if not create:
            for field in self.ignore_on_update:
                md_utils.remove_field(ts_copy, field)

            # Ignore any groups
            md_utils.remove_groups(ts_copy)
            # Only update fields that are in the diff
            md_utils.remove_fields_starting_with_and_not_in(ts_copy, vs_const.GNM_FIELD_PREFIX, self.diff)
            if 'title' not in self.diff:  # Title belongs to all collections and items, hence hardcoded and not constant
                md_utils.remove_field(ts_copy, 'title')

        return doc

    def _update_raw_metadata(self):
        '''
        Updates fields in "md_raw" from the custom attributes in "md".

        Relies heavily upon naming convention that Guardian fields begin with "gnm_" and the field_references mapping
        '''
        # Flip mapping for easier lookup
        if self.field_references is not None:
            flipped_field_ref = dict((gnm, vs) for vs, gnm in list(self.field_references.items()))
        else:
            flipped_field_ref = {}
        ts = md_utils.get_inf_timespan(self.md_raw)
        for var in vars(self.md):
            # Only update GNM-fields and selected internal Vidispine fields.
            if var.startswith(vs_const.GNM_FIELD_PREFIX) or var == vs_const.PORTAL_NLE_XML:
                # If mapping
                if var in list(flipped_field_ref.keys()):
                    md_utils.set_field_value(container=ts, field_id=flipped_field_ref[var], value=getattr(self.md, var))
                # Else straight update
                else:
                    md_utils.set_field_value(container=ts, field_id=var, value=getattr(self.md, var))

    def update_metadata_values(self, data):
        self._calculate_diffs(data)
        for key in list(data.keys()):
            if hasattr(data[key], '__iter__') and hasattr(data[key], '__getitem__'):
                values = []
                for val in data[key]:
                    values.append(Value(value=self._data_to_string(val), uuid=''))

                setattr(self.md, key, values)
            else:
                if hasattr(self.md, key) and hasattr(getattr(self.md, key), 'value'):
                    getattr(self.md, key).value = self._data_to_string(data[key])
                else:
                    setattr(self.md, key, Value(value=self._data_to_string(data[key]), uuid=''))

    def _calculate_diffs(self, data):
        for key in list(data.keys()):

            if md_utils.is_iterable_sequence(data[key]):  # Multi value fields
                values = []
                for val in data[key]:
                    values.append(Value(value=self._data_to_string(val), uuid=''))

                if hasattr(self.md, key):
                    if type(getattr(self.md, key)) is Field:  # Some attibutes are set as Field...
                        prev_values = list(getattr(self.md, key).values())
                    else:  # ... others as Value
                        prev_values = [''] if getattr(self.md, key).value is None else getattr(self.md, key).value
                        if not isinstance(prev_values, list):  # Single values
                            prev_values = [prev_values]
                    if sorted(prev_values) != sorted(values, key=lambda x: x.value):
                        self.diff.append(key)
                else:
                    if len(values) > 0:
                        self.diff.append(key)
            else:  # Single value fields
                if hasattr(self.md, key) and hasattr(getattr(self.md, key), 'value'):
                    prev_value = '' if getattr(self.md, key).value is None else getattr(self.md, key)
                    if prev_value != Value(value=self._data_to_string(data[key]), uuid=''):
                        self.diff.append(key)
                else:
                    self.diff.append(key)

    def has_permission(self, username, permission_type):
        """
        This method should check if a specific user has a specific type of permission for the current item. Permission type must be either 'READ' or 'WRITE'. This method is highly untested and may not work at all.
        """
        assert permission_type in ['READ', 'WRITE']

        url = self.acl_url + '?username={username}&permission=ALL&type=METADATA'.format(id=self.id, username=username)
        resp = vs_calls.get(url, username)
        if is_error(resp.status_code):
            # Raise appropriate exception
            raise_error(resp)

        acl = ET.fromstrin(resp.content)
        first_access = acl.find(tag('access'))
        if first_access:
            permission = first_access.find(tag('permission'))
            if permission.text == permission_type:
                return True
            if permission.text == 'WRITE' and permission_type == 'READ':
                return True
        return False

    def created(self, format=True, tz_adjust=True):
        d = self.get('created', '')
        if d == '':
            return d

        try:
            c = parse_datetime(d)
            if not c:
                logger.error('Failed to parse created timestamp value "%s" on %s' % (d, self.url))
                return d
        except ValueError:
            return d

        if tz_adjust:
            from django.conf import settings
            if hasattr(settings, "TIME_ZONE"):
                tz = pytz.timezone(settings.TIME_ZONE)
                if not c.tzinfo:
                    c = tz.localize(c)
                c = c.astimezone(tz)
        if format:
            return formats.date_format(c, "SHORT_DATETIME_FORMAT")
        return c

    def created_raw(self):
        return self.get("created", "")

    def user(self):
        return self.get('user', '')