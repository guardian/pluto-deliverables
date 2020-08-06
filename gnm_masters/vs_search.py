import requests
from xml.etree.cElementTree import Element,SubElement, tostring, fromstring
from django.conf import settings


def addSearchTerm(toEl, name,value):
    """
    builds an xml fragment representing a field to search
    :param toEl:
    :param name:
    :param value:
    :return:
    """
    fieldEl = SubElement(toEl, "field")
    nameEl = SubElement(fieldEl, "name")
    nameEl.text = name
    valueEl = SubElement(fieldEl, "value")
    valueEl.text = value
    return fieldEl


def build_search_doc(filename):
    """
    builds an XML document to perform the search
    :param filename: filename to search for
    :return: xmltree root element
    """
    rootEl = Element("ItemSearchDocument",{"xmlns":"http://xml.vidispine.com/schema/vidispine"})
    operEl = SubElement(rootEl,"operator",{"operation":"AND"})
    addSearchTerm(operEl, "gnm_type","master")
    addSearchTerm(operEl, "originalFilename", filename)
    return rootEl


def extract_values(xmldoc):
    """
    extract out the VS IDs from the document returned
    :param xmldoc: root element of an elementree-parsed document
    :return: list (iterator in python3) of item IDs
    """
    nodeIter = xmldoc.findall("{0}item".format("{http://xml.vidispine.com/schema/vidispine}"))
    return [node.attrib["id"] for node in nodeIter]


def vs_master_search(filename):
    """
    performs a search for masters with a given originalFilename in Vidispine, returning a list of VS ids
    :param filename: filename to search for
    :return: list of VS IDs as strings
    """
    from portal.plugins.gnm_vidispine_errors.exceptions import VSHttpUnexpectedStatus
    xmlDoc = build_search_doc(filename)
    output = tostring(xmlDoc, "UTF-8")

    vsBaseUrl = "{0}:{1}".format(settings.VIDISPINE_URL, settings.VIDISPINE_PORT)
    requestUrl = "{0}/API/item".format(vsBaseUrl)

    response = requests.put(requestUrl, data=output,
                            auth=(settings.VIDISPINE_USERNAME, settings.VIDISPINE_PASSWORD),
                            headers={"Content-Type":"application/xml"})
    if response.status_code == 200:
        returnedDoc = fromstring(response.text)
        return extract_values(returnedDoc)
    else:
        raise VSHttpUnexpectedStatus("Could not run vidispine search", response)
