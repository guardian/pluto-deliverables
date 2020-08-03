from uuid import uuid4
from .signals import pre_vs_call, post_vs_call

SIGNAL_SENDER = 'vs_calls'


def get_username(username, empty=True):
    # workaround for when the methods below are called with a User-like object instead of a username
    if not isinstance(username, str):
        u = getattr(username, 'username', None)
        if not isinstance(u, str):
            raise TypeError('username argument %s, "%s" is not a string nor a User object' % (type(username), str(username)))
        username = u
    if not (username or empty):
        raise ValueError('username must not be empty')
    return username


def generic_put_post(resource, data, method, username, stream=False, accept='application/xml', content_type='application/xml'):
    username = get_username(username)
    from django.conf import settings
    headers = {
        'Content-Type': content_type,
        'Accept': accept,
        'RunAs': username,
    }
    url = '{base}:{port}/API/{resource}'.format(base=settings.VIDISPINE_URL, port=settings.VIDISPINE_PORT, resource=resource)
    return method(url, headers=headers, data=data, auth=(settings.VIDISPINE_USERNAME, settings.VIDISPINE_PASSWORD), stream=stream)


def post(resource, data, username, stream=False, accept='application/xml', content_type='application/xml'):
    from requests import post

    vs_call_uuid = str(uuid4())
    pre_vs_call.send(sender=SIGNAL_SENDER, method='post_vs', url=resource, uuid=vs_call_uuid)
    ret = generic_put_post(resource, data, post, username, stream, accept, content_type)
    post_vs_call.send(sender=SIGNAL_SENDER, method='post_vs', url=resource, uuid=vs_call_uuid)
    return ret


def put(resource, data, username, stream=False, accept='application/xml', content_type='application/xml'):
    from requests import put
    vs_call_uuid = str(uuid4())
    pre_vs_call.send(sender=SIGNAL_SENDER, method='put_vs', url=resource, uuid=vs_call_uuid)
    ret = generic_put_post(resource, data, put, username, stream, accept, content_type)
    post_vs_call.send(sender=SIGNAL_SENDER, method='put_vs', url=resource, uuid=vs_call_uuid)
    return ret


def get(resource, username, accept='application/xml'):
    username = get_username(username)
    from requests import get
    from django.conf import settings
    headers = {
        'Accept': accept,
        'RunAs': username,
    }
    url = '{base}:{port}/API/{resource}'.format(base=settings.VIDISPINE_URL, port=settings.VIDISPINE_PORT, resource=resource)

    vs_call_uuid = str(uuid4())
    pre_vs_call.send(sender=SIGNAL_SENDER, method='get_vs', url=url, uuid=vs_call_uuid)
    ret = get(url, headers=headers, auth=(settings.VIDISPINE_USERNAME, settings.VIDISPINE_PASSWORD))
    post_vs_call.send(sender=SIGNAL_SENDER, method='get_vs', url=url, uuid=vs_call_uuid)
    return ret


def delete(resource, username):
    username = get_username(username)
    from requests import delete
    from django.conf import settings
    headers = {
        'RunAs': username
    }
    url = '{base}:{port}/API/{resource}'.format(base=settings.VIDISPINE_URL, port=settings.VIDISPINE_PORT, resource=resource)
    vs_call_uuid = str(uuid4())
    pre_vs_call.send(sender=SIGNAL_SENDER, method='delete_vs', url=url, uuid=vs_call_uuid)
    ret = delete(url, headers=headers, auth=(settings.VIDISPINE_USERNAME, settings.VIDISPINE_PASSWORD))
    post_vs_call.send(sender=SIGNAL_SENDER, method='delete_vs', url=url, uuid=vs_call_uuid)
    return ret


def get_noapi(resource, username):
    username = get_username(username)
    from requests import get
    from django.conf import settings
    url = '{base}:{port}{resource}'.format(base=settings.VIDISPINE_URL, port=settings.VIDISPINE_PORT, resource=resource)
    vs_call_uuid = str(uuid4())
    pre_vs_call.send(sender=SIGNAL_SENDER, method='get_vs', url=url, uuid=vs_call_uuid)
    ret = get(url)
    post_vs_call.send(sender=SIGNAL_SENDER, method='get_vs', url=url, uuid=vs_call_uuid)
    return ret
