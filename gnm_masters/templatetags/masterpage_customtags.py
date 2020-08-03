#https://docs.djangoproject.com/en/1.7/howto/custom-template-tags/

from django import template
from django.utils.html import mark_safe
import logging
import traceback
from HTMLParser import HTMLParser

register = template.Library()
logger = logging.getLogger(__name__)

@register.filter(name="show_percentage")
def jobStatusFormatter(value):
    try:
        return mark_safe(": {0:0.3n}%".format(float(value)))
    except Exception as e:
        logger.error(str(e))
        logger.error(traceback.format_exc())
        logger.error('value "%s"' % value)
        return mark_safe("")


@register.filter(name="is_string")
def is_string(value):
    print "is_string: {0}".format(value)
    return isinstance(value, basestring)


class SanitisingParser(HTMLParser):
    tag_whitelist = [
        'p','a','br','hr','li','ul','ol'
    ]

    def __init__(self, *args, **kwargs):
        HTMLParser.__init__(self, *args,**kwargs)
        self.sanitised_content = ""

    def _get_attr_value(self, attrs, tofind):
        found = filter(lambda (key, value): key==tofind, attrs)
        if found>0:
            return found[0][1]
        else:
            return None

    def handle_starttag(self, tag, attrs):
        if len(attrs)>0:
            logger.info(attrs)

        if tag=="a": #add a tooltop to the href
            href=self._get_attr_value(attrs,"href")
            if href is not None:
                attrs.append(("title", href))

        attrs_string = reduce(lambda acc,(k,v): acc+" {0}=\"{1}\"".format(k,v), attrs, "")

        if tag in self.tag_whitelist:
            self.sanitised_content += "<{t}{a}>".format(t=tag,a=attrs_string)
        else:
            self.sanitised_content += "&lt;{t}{a}&gt;".format(t=tag,a=attrs_string)

    def handle_endtag(self, tag):
        if tag in self.tag_whitelist:
            self.sanitised_content += "</{t}>".format(t=tag)
        else:
            self.sanitised_content += "&lt;/{t}&gt;".format(t=tag)

    def handle_data(self, data):
        self.sanitised_content += data


@register.filter("safehtml")
def safehtml(value):
    try:
        parser = SanitisingParser()
        parser.feed(value)
        return mark_safe(parser.sanitised_content)
    except Exception as e:
        logger.exception(e)
        return value
