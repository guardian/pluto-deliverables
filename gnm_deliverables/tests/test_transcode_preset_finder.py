from django.test import TestCase


class TestTranscodePresetFinder(TestCase):
    def test_preset_finder_known(self):
        """
        TranscodePresetFinder should return the correct setting for a known filetype
        :return:
        """
        ## note: this test depends on having the right presets in settings.py!
        from gnm_deliverables.transcodepreset import TranscodePresetFinder

        finder = TranscodePresetFinder()

        self.assertEqual(finder.match("video/mp4"), "lowres")
        self.assertEqual(finder.match("audio/aiff"), "lowaudio")

    def test_preset_finder_unknown(self):
        """
        TranscodePresetFinder should return None for an unknown filetype
        :return:
        """
        from gnm_deliverables.transcodepreset import TranscodePresetFinder

        finder = TranscodePresetFinder()

        self.assertEqual(finder.match("test/blarg"), None)

    def test_preset_finder_invalid(self):
        """
        TranscodePresetFinder should return None for a completely invalid MIME type
        :return:
        """
        from gnm_deliverables.transcodepreset import TranscodePresetFinder

        finder = TranscodePresetFinder()

        self.assertEqual(finder.match("fasdgaergaerfWGT HGFJD"), None)