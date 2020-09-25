from django.test import TestCase
from gnm_deliverables.launch_detector import LaunchDetectorUpdate


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
