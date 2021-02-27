from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APIClient
from gnm_deliverables.launch_detector import LaunchDetectorUpdate
from datetime import datetime
import pytz
from gnm_deliverables.models import DeliverableAsset
from uuid import UUID


class TestLaunchDetectorUpdate(TestCase):
    fixtures = [
        'users',
        'assets',
        'bundles'
    ]

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

    def test_launchdetector_integrationtest(self):
        """
        Integration test for launch detector endpoint
        :return:
        """
        content = {
            'title': 'yet more testing deliverables integration',
            'category': 'News',
            'atomId': 'ed94ddcb-1a9a-4081-89c2-432c7db123d9',
            'duration': 75,
            'source': None,
            'description': None,
            'posterImage': None,
            'trailText': None,
            'byline': [],
            'keywords': [],
            'trailImage': None,
            'commissionId': '10',
            'projectId': '60',
            'masterId': None,
            'published': {
               'user': 'andy.gallagher@guardian.co.uk',
               'at': '2020-09-30T17:39:17Z[Etc/UTC]'
            },
            'lastModified': {
               'user': 'andy.gallagher@guardian.co.uk',
               'at': '2020-09-30T17:39:17Z[Etc/UTC]'
            },
            'ytMeta': {
                'categoryId': '73',
                'channelId': 'abcdefg',
                'expiryDate': None,
                'keywords': ["a","b","c"],
                'privacyStatus': 'Public',
                'license': None,
                'title': "Some youtube title",
                'description': "Some youtube description"
            },
            'assets': [
                {
                    'assetType': 'Video',
                    'platform': 'youtube',
                    'platformId': '123abc',
                    'version': 1,
                },
                {
                    'assetType': 'Video',
                    'platform': 'youtube',
                    'platformId': '999xyz',
                    'version': 2,
                }
            ]
        }

        client = APIClient()
        user = User.objects.get(username='peter')
        client.force_authenticate(user=user)

        response = client.post(
            reverse('atom_update', kwargs={'atom_id': 'ed94ddcb-1a9a-4081-89c2-432c7db123d9'}),
            data=content,
            format='json'
        )

        self.assertEqual(response.status_code, 200)

        updated_item = DeliverableAsset.objects.get(pk=674)

        self.assertEqual(updated_item.atom_id, UUID('ed94ddcb-1a9a-4081-89c2-432c7db123d9'))
        self.assertIsNotNone(updated_item.gnm_website_master)
        self.assertIsNotNone(updated_item.DailyMotion_master)
        self.assertIsNotNone(updated_item.mainstream_master)
        self.assertIsNotNone(updated_item.youtube_master)
        self.assertEqual(updated_item.youtube_master.youtube_id, "999xyz")
        self.assertEqual(updated_item.youtube_master.youtube_tags, ["a","b","c"])

class TestUpdateMainstream(TestCase):
    fixtures = [
        "assets",
        "bundles",
        "users"
    ]

    def test_mainstream_keys_length(self):
        """
        update_mainstream should update the 'tags' field based on the 'keywords' field in the incoming data
        :return:
        """
        from gnm_deliverables.launch_detector import update_mainstream

        content = {
            'title': 'yet more testing deliverables integration',
            'category': 'News',
            'atomId': 'ed94ddcb-1a9a-4081-89c2-432c7db123d9',
            'duration': 75,
            'source': None,
            'description': None,
            'posterImage': None,
            'trailText': None,
            'byline': [],
            'keywords': ["key1","key2"],
            'trailImage': None,
            'commissionId': '10',
            'projectId': '60',
            'masterId': None,
            'published': {
                'user': 'andy.gallagher@guardian.co.uk',
                'at': '2020-09-30T17:39:17Z[Etc/UTC]'
            },
            'lastModified': {
                'user': 'andy.gallagher@guardian.co.uk',
                'at': '2020-09-30T17:39:17Z[Etc/UTC]'
            }
        }

        update = LaunchDetectorUpdate(content)
        test_record = DeliverableAsset.objects.get(pk=37)
        self.assertEqual([], test_record.mainstream_master.mainstream_tags)
        update_mainstream(update, test_record)

        self.assertEqual(["key1","key2"], test_record.mainstream_master.mainstream_tags)


class TestUpdateDailyMotion(TestCase):
    fixtures = [
        "assets",
        "bundles",
        "users"
    ]

    def test_dailymotion_keys_length(self):
        """
        update_dailymotion should create a new record if something does not exist
        :return:
        """
        from gnm_deliverables.launch_detector import update_dailymotion

        content = {
            'title': 'yet more testing deliverables integration',
            'category': 'News',
            'atomId': 'ed94ddcb-1a9a-4081-89c2-432c7db123d9',
            'duration': 75,
            'source': None,
            'description': None,
            'posterImage': None,
            'trailText': None,
            'byline': [],
            'keywords': ["key1","key2"],
            'trailImage': None,
            'commissionId': '10',
            'projectId': '60',
            'masterId': None,
            'published': {
                'user': 'andy.gallagher@guardian.co.uk',
                'at': '2020-09-30T17:39:17Z[Etc/UTC]'
            },
            'lastModified': {
                'user': 'andy.gallagher@guardian.co.uk',
                'at': '2020-09-30T17:39:17Z[Etc/UTC]'
            }
        }

        update = LaunchDetectorUpdate(content)
        test_record = DeliverableAsset.objects.get(pk=37)

        update_dailymotion(update, test_record)

        self.assertEqual(["key1","key2"], test_record.DailyMotion_master.daily_motion_tags)