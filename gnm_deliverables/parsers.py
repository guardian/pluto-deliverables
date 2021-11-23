from rest_framework.parsers import BaseParser
from rest_framework.exceptions import ParseError
from django.conf import settings
import codecs
import logging

logger = logging.getLogger(__name__)


class PlainTextParser(BaseParser):
    """
    Plain text parser, from https://www.django-rest-framework.org/api-guide/parsers/
    """
    media_type = 'text/plain'

    def parse(self, stream, media_type=None, parser_context=None):
        """
        Simply return a string representing the body of the request.
        """
        parser_context = parser_context or {}
        encoding = parser_context.get('encoding', settings.DEFAULT_CHARSET)

        try:
            decoded_stream = codecs.getreader(encoding)(stream)
            return decoded_stream.read()
        except LookupError as e:
            logger.error("Could not find codec for text encoding {0}".format(encoding))
            raise ParseError("Could not find text codec, see logs")
