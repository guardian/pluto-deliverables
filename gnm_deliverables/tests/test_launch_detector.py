from django.test import TestCase
from gnm_deliverables.launch_detector import LaunchDetectorUpdate
from datetime import datetime
import pytz


class TestLaunchDetectorUpdate(TestCase):
    def test_validate(self):
        """
        LaunchDetectorUpdate should validate a message with nulls
        :return:
        """
        content = {
            "title": "some title",
            "category": "some category",
            "duration": None,
            "source": None,
            "description": "blahblahblah",
            "posterImage": {
                "file": "some-file-uri"
            },
            "trailText": None,
            "byline": ["Fred Smith", "Jane Bloggs"],
            "keywords": None,
            "trailImage": None,
            "commissionId": None,
            "projectId": None,
            "masterId": None,
            "published": None,
            "lastUpdate": {
                "user": "Jane Bloggs",
                "at": "2020-01-02T03:04:05+0000"
            }
        }

        result = LaunchDetectorUpdate(content)
        self.assertEqual(result.title,"some title")
        self.assertEqual(result.category, "some category")

    def test_validate_realdata(self):
        """
        LaunchDetectorUpdate should not fail on real data
        :return:
        """
        content = {'title': 'yet more testing deliverables integration', 'category': 'News', 'atomId': 'ed94ddcb-1a9a-4081-89c2-432c7db123d9', 'duration': 75, 'source': None, 'description': None, 'posterImage': None, 'trailText': None, 'byline': [], 'keywords': [], 'trailImage': None, 'commissionId': '10', 'projectId': '60', 'masterId': None, 'published': {'user': 'andy.gallagher@guardian.co.uk', 'at': '2020-09-30T17:39:17Z[Etc/UTC]'}, 'lastModified': {'user': 'andy.gallagher@guardian.co.uk', 'at': '2020-09-30T17:39:17Z[Etc/UTC]'}}

        result = LaunchDetectorUpdate(content)
        self.assertEqual(result.published.at, datetime(2020,9,30,17,39,17,tzinfo=pytz.UTC))