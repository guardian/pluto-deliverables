import re
from django.conf import settings
import base64
import http.client
import logging
import xml.dom.minidom as minidom
import os.path

logger = logging.getLogger(__name__)


class HTTPError(Exception):
    pass


def shape_id_for_tag(itemid,tagname):
    import json

    user = settings.VIDISPINE_USERNAME
    passwd = settings.VIDISPINE_PASSWORD
    port = settings.VIDISPINE_PORT
    parts = re.search(r'://(.*):*',settings.VIDISPINE_URL)
    if parts is not None:
        server = parts.group(1)
    else:
        raise ValueError("Could not get server name from url {0}".format(settings.VIDISPINE_URL))

    auth = base64.encodestring('%s:%s' % (user, passwd)).replace('\n', '')
    headers = {'Accept': 'application/json',
               'Authorization': "Basic %s" % auth}

    conn = http.client.HTTPConnection(server, port)
    url = "/API/item/{itemid}/shape?tag={tag}".format(itemid=itemid,tag=tagname)
    conn.request("GET",url,"",headers)
    response=conn.getresponse()
    if response.status < 200 or response.status > 299:
        logger.error("%s: Server returned %d when trying to find original shape (%s)\n%s\n" % (itemid, response.status, response.reason, response.read()))
        raise HTTPError("%s Server returned %d (%s)\n%s" % (itemid, response.status, response.reason, response.read()))

    data = json.loads(response.read())
    return data['uri'][0]


def _extract_value(record):
    import traceback
    try:
        val = [x['value'] for x in record['value']] #record['value'][0]['value']
    except KeyError as e:
        val = [] #we often get fields with no values, so just ignore them.
    except Exception as e:
        logger.warning(traceback.format_exc())
        val = []
    return [record['name'], val]


def export_metadata(itemId, outpath, originalFilename, projection, prefix=""):
    import codecs
    user = settings.VIDISPINE_USERNAME
    passwd = settings.VIDISPINE_PASSWORD
    port = settings.VIDISPINE_PORT
    parts = re.search(r'://(.*):*',settings.VIDISPINE_URL)
    if parts is not None:
        server = parts.group(1)
    else:
        raise ValueError("Could not get server name from url {0}".format(settings.VIDISPINE_URL))

    auth = base64.encodestring('%s:%s' % (user, passwd)).replace('\n', '')

    headers = {'Accept': 'application/xml',
               'Content-Type': 'application/xml'}

    headers['Authorization'] = "Basic %s" % auth
    conn = http.client.HTTPConnection(server, port)
    url = "/API/item/%s/metadata;projection=%s" % (str(itemId), projection)
    method = "GET"
    body = ""

    logger.info("%s %s: Requesting url path: %s" % (prefix, itemId, url))

    conn.request(method, url, body, headers)
    response = conn.getresponse()
    if response.status != 200:
        logger.error("%s %s: Server returned %d (%s)\n%s\n" % (prefix, itemId, response.status, response.reason, response.read()))
        raise HTTPError("%s Server returned %d (%s)\n%s" % (itemId, response.status, response.reason, response.read()))

    outfile = os.path.join(outpath, os.path.basename(originalFilename) + ".xml")
    rawcontent = response.read()
    rawcontent = rawcontent.decode("utf-8")

    try:
        xml = minidom.parseString(rawcontent.encode("UTF-8"))
        logger.info("%s %s: output path is %s\n" % (prefix, itemId, outfile))

        fout = codecs.open(str(outfile), 'w', "UTF-8")
        xml.writexml(fout, indent="", addindent="    ", newl="\n")
        fout.close()
        return outfile

    except Exception as e:
        logger.warn("%s %s: An error occurred: %s %s" % (prefix, itemId, e.__class__, str(e)))
        logger.info("%s %s: output path is %s" % (prefix, itemId, outfile))

        fout = codecs.open(str(outfile), 'w',"UTF-8")
        fout.write(rawcontent)
        fout.close()
        raise


def item_information(itemId, fieldnames, hide_empty=True, simplify=False):
    """
    Returns given metadata field names from item id.  Needed by shape rules, which don't have metadata by default
    :param itemId: item ID to look up for
    :param fieldnames: list of field names to look up
    :return: list of values for each field name
    """
    import json
    single_request=False
    if not isinstance(fieldnames, list):
        fieldnames = [fieldnames]
        single_request=True


    user = settings.VIDISPINE_USERNAME
    passwd = settings.VIDISPINE_PASSWORD
    port = settings.VIDISPINE_PORT
    parts = re.search(r'://(.*):*',settings.VIDISPINE_URL)
    if parts is not None:
        server = parts.group(1)
    else:
        raise ValueError("Could not get server name from url {0}".format(settings.VIDISPINE_URL))

    auth = base64.encodestring('%s:%s' % (user, passwd)).replace('\n', '')
    headers = {'Accept': 'application/json',
               'Authorization': "Basic %s" % auth}

    conn = http.client.HTTPConnection(server, port)
    url = "/API/item/{itemid}/metadata;field={fieldlist}".format(itemid=str(itemId),fieldlist=",".join(fieldnames))
    method = "GET"
    body = ""

    logger.info("reuqest URL path: {0}".format(url))
    conn.request(method, url, body, headers)
    response = conn.getresponse()
    if response.status != 200:
        logger.error("%s: Server returned %d (%s)\n%s\n" % (itemId, response.status, response.reason, response.read()))
        raise HTTPError("%s Server returned %d (%s)\n%s" % (itemId, response.status, response.reason, response.read()))

    data=json.loads(response.read())
    content=data['item'][0]['metadata']['timespan'][0]['field']

    mapped_data = [_extract_value(x) for x in content]
    rtn = {}
    for pair in mapped_data:
        if simplify and single_request:
            return(",".join(pair[1]))
        if hide_empty:
            if len(pair[1]) == 0:
                continue
        rtn[pair[0]] = pair[1]
    return rtn
