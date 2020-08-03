from lxml.builder import ElementMaker
import logging
from lxml import etree as ET


def parse_xml(data):
    parser = ET.XMLParser(recover=True, encoding='utf-8')
    if isinstance(data, str) or isinstance(data, bytes):
        doc = ET.fromstring(data, parser=parser)
    else:
        doc = ET.parse(data, parser=parser)
    return doc


def is_iterable_sequence(obj):
    '''
    Quick check if an object appears to be a iterable sequence via Duck-typing.
    '''
    return hasattr(obj, '__iter__') and hasattr(obj, '__getitem__')


def is_new_status(new_status, old_status, sought_status):
    '''
    If it is a new status for Commission or Project

    Keyword arguments:
        new_status -- Incomming status
        old_status -- Current status
        sought_status -- The status to check for switching to.
    '''
    # Not a status change
    if new_status == old_status:
        return False
    return new_status == sought_status

def remove_groups(container):
    for g in container.getchildren():
        if g.tag in tag('group'):  # return value from tag() starts with .// buth otherwise matches
            print(g)
            container.remove(g)

def remove_field(container, field_id):
    '''
    Remove a field from a lxml dom node.
    If no field with the given ID is found this method does nothing. No error or other warning is given if nothing is removed.
    If more than one field exists with the given field_id only the first one found is removed.

    Keyword arguments:
        container -- node to search for field with field_id
        field_id -- name of field node.
    '''
    field = find_field(container, field_id)
    if field is not None:
        container.remove(field)


def remove_fields(container, field_id):
    '''
    Remove all occurences of fields with a given id from a lxml dom node.
    If no fields with the given ID are found this method does nothing. No error or other warning is given if nothing is removed.

    Keyword arguments:
        container -- node to search for fields with field_id
        field_id -- name of field nodes.
    '''
    fields = find_fields(container, field_id)
    if fields is not None:
        for field in fields:
            container.remove(field)


def remove_fields_starting_with(container, starting_with):
    '''
    Remove all occurences of fields with a given id from a lxml dom node.
    If no fields with the given ID are found this method does nothing. No error or other warning is given if nothing is removed.

    Keyword arguments:
        container -- node to search for fields with field_id
        field_id -- name of field nodes.
    '''
    fields = find_fields(container, starting_with, name_is_prefix=True)
    if fields is not None:
        for field in fields:
            container.remove(field)


def remove_fields_starting_with_and_not_in(container, starting_with, exclusion_list):
    '''
    Remove all occurences of fields with a given id from a lxml dom node if it is not in the exclusion list.
    If no fields with the given ID are found this method does nothing. No error or other warning is given if nothing is removed.

    Keyword arguments:
        container -- node to search for fields with field_id
        starting_with -- the prefix of the field nodes to find.
        exclusion_list -- list of fields names to exclude from removal operation.
    '''
    exclusion_list = [find_field(container, x) for x in exclusion_list]
    fields = find_fields(container, starting_with, name_is_prefix=True)
    if fields is not None:
        for field in fields:
            if field not in exclusion_list:
                container.remove(field)


def find_field(timespan, field_id):
    '''
    Find a field with a specific uuid, or name, in a timespan

    timespan: metadata timespan to search in
    field_id: first assumed to be uuid, if no hit tries to find by name
    '''
    # Probably a uuid
    for f in timespan.findall(tag('field')):
        if f.attrib.get('uuid', '') == field_id:
            return f

    # Then it must be a name
    for f in timespan.findall(tag('field')):
        if f.find(tag('name')) is not None and f.find(tag('name')).text == field_id:
            return f

    # Not found :(
    return None


def find_fields(timespan, field_name, name_is_prefix=False):
    '''
    Find all fields with a specific name, in a timespan

    timespan: metadata timespan to search in
    field_name: name of field (or more specifically text in name element in field)
    name_is_prefix: if true, match fields beginning with field_name
    '''
    l = []
    for f in timespan.findall(tag('field')):
        if name_is_prefix:
            if f.find(tag('name')).text.startswith(field_name):
                l.append(f)
        else:
            if f.find(tag('name')).text == field_name:
                l.append(f)
    return l


def find_group_by_name(timespan, name):
    '''
    Find first group with a specific name, in a timespan

    timespan: metadata timespan to search in
    name: name of groups to find
    '''

    for f in timespan.findall(tag('group')):
        if f.find(tag('name')).text == name:
            return f
    return None


def find_groups_by_name(timespan, name):
    '''
    Find groups with a specific name, in a timespan

    timespan: metadata timespan to search in
    name: name of groups to find
    '''
    if timespan is None:
        raise Exception('You need to populate metadata elements for Commissioner, ProjectType, etc')

    l = []
    for f in timespan.findall(tag('group')):
        if f.find(tag('name')).text == name:
            l.append(f)
    return l


def find_group_by_value(timespan, groupname, value):
    '''
    Find a group with a specific value.

    Keyword attributes:
        timespan -- Metadata timespan to search in
        groupname -- Name of metadata group(s) to search for the value
        value -- Value in searched group
    Returns:
        XML Representation of group with value or None if nothing is found
    '''
    groups = find_groups_by_name(timespan, groupname)
    for group in groups:
        for field in group.findall(tag('field')):
            for v in field.findall(tag('value')):
                if v.text == value:
                    return group
    # Nothing found
    return None


def find_data_by_key(timespan, key):
    '''
    Find data with a specific key, in a timespan

    timespan: metadata timespan to search in
    key: key of data tag to find
    '''

    for f in timespan.findall(tag('data')):
        if f.find(tag('key')).text == key:
            return f
    return None


def get_field_value(container, field_id):
    '''
    container - any minidom object that contains fields as children
    field_id - uuid or name in field
    '''
    field = find_field(container, field_id)
    if field is not None:
        return field.find(tag('value')).text
    return None


def get_field_value_by_key(containers, key):
    '''
    containers - list of any minidom object that contains fields as children
    field_id - uuid or name in field
    '''

    field = None
    for c in containers:
        for f in c.findall(tag('field')):
            if f.find(tag('key')).text == key:
                field = f

    if field is not None:
        return field.find(tag('value')).text
    return None


def set_field_value(container, field_id, value):
    field = find_field(container, field_id)
    if field is not None:
        if is_iterable_sequence(value):
            values = field.findall(tag('value'))
            for v in values:
                v.set('mode', 'remove')
            for v in value:
                if v.value is not None:
                    field.append(E.value(v.value, mode='add'))
        else:
            valuetag = field.find(tag('value'))
            if valuetag is None:
                field.append(E.value(value.value, mode='add'))
            else:
                valuetag.text = value.value
    else:
        if is_iterable_sequence(value):
            new_field = E.field(
                E.name(field_id),
            )
            for v in value:
                new_field.append(E.value(v.value, mode='add'))
        else:
            new_field = E.field(
                E.name(field_id),
                E.value(value.value, mode='add')
            )
        container.append(new_field)


def set_reference(container, field_id, uuid):
    field = find_field(container, field_id)
    if field is not None:
        reftag = field.find(tag('reference'))
        if reftag is None:
            field.append(E.reference(uuid))
        else:
            reftag.text = uuid
    else:
        new_field = E.field(
            E.name(field_id),
            E.reference(uuid)
        )
        container.append(new_field)


def get_field_uuid(container, field_id):
    field = find_field(container, field_id)
    return field.attrib.get('uuid')


def update_data_in_metadata(metadata, new_values):
    '''
    Update metadata document.
    Since it's an update all fields should already exist and have a uuid.
    It does not support fields with more than one value.

    new_values:  structure: {field-uuid : (value-uuid, data), }
    '''
    # FIXME Do a check at the end to see if there are fields in "new_values" that did not have matching fields and print some error message for easier debugging? Otherwise these fields silently just won't be updated.
    timespan = get_inf_timespan(metadata)

    for f in timespan.findall(tag('field')):
        if f.attrib.get('uuid', None) in new_values:
            uuid, data = new_values[f.attrib.get('uuid', '')]
            for value in f.findall(tag('value')):
                if f.attrib.get('uuid', None) == uuid:
                    value.text = data


def get_inf_timespan(metadata):
    '''
    '''
    return metadata.find(tag("timespan[@start='-INF'][@end='+INF']"))


def get_jobid(xmlstring):
    doc = parse_xml(xmlstring)
    jobid_tag = doc.find(tag('jobId'))
    if jobid_tag is None:
        return None
    return jobid_tag.text


def tag(name):
   return './/{http://xml.vidispine.com/schema/vidispine}%s' % name


def just_tag(name):
    return '{http://xml.vidispine.com/schema/vidispine}%s' % name


# See documentation for lxml, The E-factory
E = ElementMaker(namespace="http://xml.vidispine.com/schema/vidispine",
                 nsmap={None: "http://xml.vidispine.com/schema/vidispine"})
