import re
import logging

logger = logging.getLogger(__name__)

pair_splitter = re.compile(r'^(\w{2}-\d+)=(.*)$')


class ItemNotification(object):
    """
    This class abstracts the Vidispine item notification document to allow for easier reading.
    """

    def __init__(self, jsondict: dict):
        self._content = jsondict
        if jsondict is not None and not self.validate():
            raise ValueError("The provided JSON data is not a Vidispine item document.")

    def __getattr__(self, item):
        for entry in self._content["field"]:
            if entry["key"] == item:
                return entry["value"]
        return None

    def __str__(self):
        return "{type} job for {filename} by {user}".format(type=self.type,filename=self.originalFilename,user=self.username)

    REQUIRED_FIELDS = ["itemId", "action"]

    def validate(self):
        """
        Checks that the contained message contains the fields we are expecting, as defined by the static list ItemNotification.REQUIRED_FIELDS.
        :return: a boolean indicating True for valid or False for invalid
        """
        all_fields_found = False
        try:
            for f in self.REQUIRED_FIELDS:
                field_found = False
                for entry in self._content["field"]:
                    if entry["key"] == f:
                        field_found = True
                if field_found:
                    all_fields_found = True
                else:
                    logger.warning("Invalid message, missing field {0}".format(f))
                    return False
            if all_fields_found:
                return True
        except KeyError:
            logger.warning("Invalid message {0}, missing required data structure".format(self._content))
            return False

