import django.test
from mock import MagicMock, patch
import json

class TestSyndicationStats(django.test.TestCase):
    def test_msInfo_correctjson(self):
        """
        mainstream syndication info should return html of json object
        :return:
        """
        from portal.plugins.gnm_masters.templatetags.syndicationstats_customfilters import msInfo
        fake_info = {"response": {"mainstreamsyndication": "allow"}}
        result = msInfo(json.dumps(fake_info))
        self.assertEqual(result, '<img class="inline_icon" src="/sitemedia/img/gnm/severity_0.png">allow')

    def test_msInfo_invalidjson(self):
        """
        mainstream syndication info should not error if there is invalid json
        :return:
        """
        from portal.plugins.gnm_masters.templatetags.syndicationstats_customfilters import msInfo
        result = msInfo("fdsjkhdfsthisisnotjson")

        self.assertEqual(result,'<img class="inline_icon" src="/sitemedia/img/gnm/severity_3.png">error: not json')

    def test_msInfo_notpresent(self):
        """
        mainstream syndication info should not error if there is no value
        :return:
        """
        from portal.plugins.gnm_masters.templatetags.syndicationstats_customfilters import msInfo
        result = msInfo("")

        self.assertEqual(result,'<img class="inline_icon" src="/sitemedia/img/gnm/severity_0.png">None')