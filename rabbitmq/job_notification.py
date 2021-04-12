import re
import logging

logger = logging.getLogger(__name__)

pair_splitter = re.compile(r'^(\w{2}-\d+)=(.*)$')


class JobNotification(object):
    """
    This class abstracts the Vidispine job notification document to allow for easier reading
    """

    def __init__(self, jsondict: dict):
        self._content = jsondict
        if not self.validate():
            raise Exception

    def __getattr__(self, item):
        for entry in self._content["field"]:
            if entry["key"]==item:
                return entry["value"]
        return None

    def __str__(self):
        return "{type} job for {filename} by {user}".format(type=self.type,filename=self.originalFilename,user=self.username)

    REQUIRED_FIELDS = ["jobId", "itemId", "status"]
    def validate(self):
        try:
            for f in self.REQUIRED_FIELDS:
               for entry in self._content["field"]:
                  if entry["key"] == f:
                      return True
               logger.warning("Invalid message, missing field {0}".format(f))
            return False
        except KeyError:
            logger.warning("Invalid message {0}, missing required data structure".format(self._content))
            return False

    def file_paths(self):
        """
        Returns a dictionary of relative file path/file ID pairs, from the filePathMap parameter
        :return: dictionary
        """
        if self.filePathMap is None:
            return None

        pairs = self.filePathMap.split(',')

        def split_pair(pair): #can't be sure that there will be no = in the filename
            result = pair_splitter.match(pair)
            if result:
                return (result.group(1), result.group(2))
            else:
                return None

        return dict([result for result in [split_pair(pair) for pair in pairs] if result is not None])
