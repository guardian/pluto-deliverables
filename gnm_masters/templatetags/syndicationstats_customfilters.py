#https://docs.djangoproject.com/en/1.7/howto/custom-template-tags/

from django import template
from django.utils.safestring import mark_safe
import logging
import json

register = template.Library()
logger = logging.getLogger(__name__)

@register.filter("jobstatus_formatter")
def jobStatusFormatter(value):
    classname = value.lower()

    return "<span class=\"{0}\">{1}</span>".format(classname,value)

iconpath = '/sitemedia/img/gnm/'


def getvalue(rawdata, key):
    if rawdata=="":
        return None, iconpath + 'severity_0.png'

    try:
        content = json.loads(unicode(rawdata))
        if key in content['response']:
            if content['response'][key]=='allow':
                icon = iconpath + 'severity_0.png'
            elif content['response'][key]=='forbid':
                icon = iconpath + 'severity_3.png'
            else:
                icon = iconpath + 'severity_1.png'
            return content['response'][key], icon
        else:
            return "n/a", iconpath + 'severity_3.png'
    except ValueError:
        return "error: not json", iconpath + 'severity_3.png'


@register.filter("syndicationstatus_icon")
def syndicationStatusFormatter(value):
    icon = None
    iconpath = '/sitemedia/img/gnm/'

    if(value=='Upload Succeeded'):
        icon = iconpath + 'published.png'
    elif(value=='Do Not Send'):
        icon = iconpath + 'unpublished.png'
    elif(value=='Upload Failed'):
        icon = iconpath + 'severity_3.png'
    elif(value=='Ready to Upload'):
        icon = iconpath + 'ready_to_publish.png'
    elif(value=='Upload in Progress'):
        icon = iconpath + 'ready_to_publish.png'
    elif(value=='Transcode in Progress'):
        icon = iconpath + 'ready_to_publish.png'
    elif('Not Ready' in value):
        icon = iconpath + 'draft.png'

    if icon is not None:
        iconstr = "<img src=\"{0}\" alt=\"{1}\">".format(icon,value)
    else:
        iconstr = ""

    if ('Not Ready' in value) & (value != 'Not Ready'):
        textforpassing = value
        return mark_safe(u"<span class=\"{0}\">{1}&nbsp;&nbsp;{2}</span>".format(textforpassing,iconstr,'Not Ready'))
    else:
        textforpassing = value.lower()

    if value == 'Not Ready':
        textforpassing = value.lower()

    return mark_safe(u"<span class=\"{0}\">{1}&nbsp;&nbsp;{2}</span>".format(textforpassing,iconstr,value))


@register.filter("pacformindicator")
def pacformIndicator(value):
    iconpath = '/sitemedia/img/gnm/'

    text = ""
    icon_url = ""
    if value=="valid":
        icon_url = iconpath + 'severity_0.png'
        text = "valid"
    elif value=="processing":
        icon_url = iconpath + 'severity_1.png'
        text = "processing"
    elif value=="invalid":
        icon_url = iconpath + 'severity_3.png'
        text = "invalid"
    elif value=="missing":
        icon_url = iconpath + 'severity_2.png'
        text = "missing"
    else:
        icon_url = iconpath + 'severity_1.png'
        text = "unknown"

    return mark_safe(u"<img class=\"inline_icon\" src=\"{0}\">{1}".format(icon_url,text))

@register.filter("automationindicator")
def automationIndicator(value):
    iconpath = '/sitemedia/img/gnm/'

    if '"status": "ok"' in str(value):
        icon_url = iconpath + 'severity_0.png'
        text = 'Okay'
    elif str(value)=="":
        icon_url = iconpath + 'severity_2.png'
        text = 'Not&nbsp;set'
    else:
        icon_url = iconpath + 'severity_3.png'
        text = 'Failed'

    return mark_safe(u"<img class=\"inline_icon\" src=\"{0}\">{1}".format(icon_url,text))

@register.filter("msinfo")
def msInfo(value):
    text,icon_url = getvalue(value, "mainstreamsyndication")

    return mark_safe(u"<img class=\"inline_icon\" src=\"{0}\">{1}".format(icon_url,text))

@register.filter("dminfo")
def dmInfo(value):
    text,icon_url = getvalue(value, "dailymotion")

    return mark_safe(u"<img class=\"inline_icon\" src=\"{0}\">{1}".format(icon_url,text))

@register.filter("ytinfo")
def ytInfo(value):
    text,icon_url = getvalue(value,"youtube")
    return mark_safe(u"<img class=\"inline_icon\" src=\"{0}\">{1}".format(icon_url,text))

@register.filter("fbinfo")
def fbInfo(value):
    text,icon_url = getvalue(value, "facebook")
    return mark_safe(u"<img class=\"inline_icon\" src=\"{0}\">{1}".format(icon_url,text))

@register.filter("sinfo")
def sInfo(value):
    text,icon_url = getvalue(value, "spotify")
    return mark_safe(u"<img class=\"inline_icon\" src=\"{0}\">{1}".format(icon_url,text))

@register.filter("automationerrors")
def automationErrors(value):
    import json

    try:
        jdata = json.loads(unicode(value))
    except Exception as e:
        logging.warning(u"Could not parse json from {0}: {1}".format(value, str(e)))
        return mark_safe(value)

    if jdata["status"]=="ok":
        return mark_safe("None")
    else:
        if 'error' in jdata and 'message' in jdata['error']:
            return mark_safe(jdata['error']['message'])
        elif 'error' in jdata:
            return mark_safe(str(jdata['error']))
        else:
            return mark_safe("Couldn't extract actual error from data: {0}".format(value))

@register.filter("ruleinfo")
def ruleInfo(value):

    import json

    if value != "":
        try:
            jdata = json.loads(str(value))
            return jdata['matched']['rule']
        except Exception as e:
            return "Could not determine rule: {0}".format(str(e))
    else:
        return 'None'

@register.filter("displaydate")
def displayDate(value):

    import time
    import re

    if re.match("\d", value) is not None:

        try:
            inputdate = time.strptime(value, "%Y-%m-%dT%H:%M:%SZ")
        except:
            inputdate = time.strptime(value, "%Y-%m-%dT%H:%M:%S")

        try:
            finisheddate = time.strftime("%H:%M:%S %d/%m/%Y", inputdate).lstrip("0").replace("/0", "/").replace(" 0", " ")
        except:
            return value
        if finisheddate[0] == ':':
            finisheddate = '0'+finisheddate
        return finisheddate
    else:
        return ""

@register.filter("displaydateinfo")
def displayDateInfo(value):
    timestamp = getattr(value,'timestamp',None)

    if timestamp is not None:
        return timestamp
    else:
        return "n/a"