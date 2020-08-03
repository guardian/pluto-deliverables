import logging
import time

logger = logging.getLogger(__name__)


def safeget(dct, *keys, **kwargs):
    if dct is None:
        return kwargs.get('default', None)
    for key in keys:
        try:
            dct = dct[key]
        except (KeyError, TypeError):
            return kwargs.get('default', None)
    return dct


def get_inf_timespan(item):
    timespans = safeget(item, 'metadata', 'timespan', default=[])
    for timespan in timespans:
        if timespan['start'] == '-INF' and timespan['end'] == '+INF':
            return timespan
    return None


def get_shape_with_tag(item, tag):
    shapes = safeget(item, 'shape')
    if shapes is not None:
        for shape in shapes:
            for shape_tag in safeget(shape, 'tag', default=[]):
                if shape_tag == tag:
                    return shape
    return None


def get_fields_in_inf(item, fields=None):
    if fields is None:
        fields = []
    timespan = get_inf_timespan(item)
    if timespan is not None:
        return get_fields(timespan['field'], fields)
    return None


def get_fields(list, fields=None, lookupName='name'):
    ret = dict()
    for field in fields:
        for ts_field in list:
            if ts_field[lookupName] == field:
                ret[field] = ts_field
                break
        else:
            ret[field] = None
    return ret



def seconds_to_timestamp(seconds):
    return time.strftime('%H:%M:%S', time.gmtime(float(seconds)))
