from django.conf import settings
import re


class TranscodePresetFinder(object):
    def __init__(self, presets=None):
        """
        initialise the finder, by compiling the regexes present
        :param presets: optional parameter to override the presets list. If not present, TRANSCODE_PRESETS from settings.py
        is used.  This should be a dictionary, where the key is the regex source string and the value is the setting to use
        """
        if presets is None:
            presets = settings.TRANSCODE_PRESETS
        self._matchers = [TranscodePresetFinder.__compile_setting(x) for x in presets.items()]

    @staticmethod
    def __compile_setting(kvtuple):
        return (
            re.compile(kvtuple[0]),
            kvtuple[1]
        )

    def match(self, mimeType):
        """
        tries to find a matching transcode preset for the given MIME type from the settings.
        :param mimeType: MIME type to check
        :return: either the preset name as a string or None if nothing could be found
        """
        for entry in self._matchers:
            if entry[0].search(mimeType) is not None:
                return entry[1]

        return None