import json
import dateutil.parser


class VSNotification(object):
    def __init__(self, new_content={}):
        self._content = new_content

    @staticmethod
    def from_bytes(bytesobject:bytes):
        """
        initialise a VSNotification from raw bytes sent by the server
        can raise json parse exceptions, or ValueError if expecteed keys are not available
        :param bytesobject: a bytes object of content
        :return:
        """
        parsed_content = json.loads(bytesobject.decode("UTF-8"))
        if "field" in parsed_content:
            dict_content = {}
            for entry in parsed_content["field"]:
                dict_content[entry["key"]] = entry["value"]
            return VSNotification(new_content=dict_content)
        else:
            raise ValueError("content was missing root array")

    @property
    def import_source(self, default=None):
        if "import_source" in self._content:
            return self._content["import_source"]
        else:
            return default

    @property
    def project_id(self, default=None):
        if "project_id" in self._content:
            return int(self._content["project_id"])
        else:
            return default

    @property
    def asset_id(self, default=None):
        if "asset_id" in self._content:
            return int(self._content["asset_id"])
        else:
            return default

    @property
    def started(self, default=None):
        if "started" in self._content:
            return dateutil.parser.parse(self._content["started"])
        else:
            return None

    @property
    def vsIDs(self, default=None):
        """
        returns a 3-tuple of vidipsine IDs - the item, the job and the file
        :param default:
        :return:
        """
        return (
            self._content.get("itemId", None),
            self._content.get("jobId", None),
            self._content.get("fileId", None)
        )

    @property
    def status(self, default=None):
        return self._content.get("status", default)

    @property
    def currentStepStatus(self, default=None):
        return self._content.get("currentStepStatus", default)