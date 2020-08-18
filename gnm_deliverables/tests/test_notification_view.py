from django.test import TestCase
from gnm_deliverables.models import DeliverableAsset, Deliverable
from gnm_deliverables.choices import DELIVERABLE_ASSET_STATUS_NOT_INGESTED,\
    DELIVERABLE_ASSET_STATUS_INGESTED,\
    DELIVERABLE_ASSET_STATUS_INGEST_FAILED, \
    DELIVERABLE_ASSET_STATUS_INGESTING
from django.urls import reverse
from django.contrib.auth.models import User
import json


class TestNotificationView(TestCase):
    fixtures = [
        "notification_test_initial",
        "users.yaml"
    ]

    def TestNotificationViewAbsent(self):
        """
        NotificationView should return 200 if the record does not exist
        :return:
        """
        ##check our initial state is what we expect
        initial_state = DeliverableAsset.objects.get(pk=1)
        self.assertEqual(initial_state.online_item_id, None)
        self.assertEqual(initial_state.status, DELIVERABLE_ASSET_STATUS_NOT_INGESTED)

        ##make the request
        fake_notification = b"""{"field":[{"key":"asset_id","value":"99999"},{"key":"import_source","value":"pluto-deliverables"}]}"""
        self.client.force_login(user=User.objects.get(username="peter"))
        response = self.client.post(reverse("vs-notifications"), fake_notification, content_type="application/json")

        self.assertEqual(response.status_code, 200)

        final_state = DeliverableAsset.objects.get(pk=1)
        self.assertEqual(final_state.online_item_id, None)
        self.assertEqual(final_state.status, DELIVERABLE_ASSET_STATUS_NOT_INGESTED)

    def TestNotificationViewUpdate(self):
        """
        NotificationView should update an existing item with completion data
        :return:
        """
        ##check our initial state is what we expect
        initial_state = DeliverableAsset.objects.get(pk=1)
        self.assertEqual(initial_state.online_item_id, None)
        self.assertEqual(initial_state.status, DELIVERABLE_ASSET_STATUS_NOT_INGESTED)

        ##make the request
        notification_content = {
            "field": [
                {"key":"asset_id","value":"1"},
                {"key":"import_source","value":"pluto-deliverables"},
                {"key":"project_id","value":"12"},
                {"key":"itemId","value":"VX-1234"},
                {"key":"jobId","value":"VX-2345"},
                {"key":"status","value":"FINISHED"}
            ]
        }

        fake_notification = json.dumps(notification_content).encode("UTF-8")
        self.client.force_login(user=User.objects.get(username="peter"))
        response = self.client.post(reverse("vs-notifications"), fake_notification, content_type="application/json")

        self.assertEqual(response.status_code, 200)

        final_state = DeliverableAsset.objects.get(pk=1)
        self.assertEqual(final_state.online_item_id, "VX-1234")
        self.assertEqual(final_state.status, DELIVERABLE_ASSET_STATUS_INGESTED)
        self.assertIsNotNone(final_state.ingest_complete_dt)

    def TestNotificationViewUpdateFailure(self):
        """
        NotificationView should update an existing item with failure data
        :return:
        """
        ##check our initial state is what we expect
        initial_state = DeliverableAsset.objects.get(pk=1)
        self.assertEqual(initial_state.online_item_id, None)
        self.assertEqual(initial_state.status, DELIVERABLE_ASSET_STATUS_NOT_INGESTED)

        ##make the request
        notification_content = {
            "field": [
                {"key":"asset_id","value":"1"},
                {"key":"import_source","value":"pluto-deliverables"},
                {"key":"project_id","value":"12"},
                {"key":"itemId","value":"VX-1234"},
                {"key":"jobId","value":"VX-2345"},
                {"key":"status","value":"FAILED_TOTAL"}
            ]
        }

        fake_notification = json.dumps(notification_content).encode("UTF-8")
        self.client.force_login(user=User.objects.get(username="peter"))
        response = self.client.post(reverse("vs-notifications"), fake_notification, content_type="application/json")

        self.assertEqual(response.status_code, 200)

        final_state = DeliverableAsset.objects.get(pk=1)
        self.assertEqual(final_state.online_item_id, None)
        self.assertEqual(final_state.status, DELIVERABLE_ASSET_STATUS_INGEST_FAILED)
        self.assertIsNotNone(final_state.ingest_complete_dt)

    def TestNotificationViewUpdateRunning(self):
        """
        NotificationView should update an existing item with currently running data
        :return:
        """
        ##check our initial state is what we expect
        initial_state = DeliverableAsset.objects.get(pk=1)
        self.assertEqual(initial_state.online_item_id, None)
        self.assertEqual(initial_state.status, DELIVERABLE_ASSET_STATUS_NOT_INGESTED)

        ##make the request
        notification_content = {
            "field": [
                {"key":"asset_id","value":"1"},
                {"key":"import_source","value":"pluto-deliverables"},
                {"key":"project_id","value":"12"},
                {"key":"itemId","value":"VX-1234"},
                {"key":"jobId","value":"VX-2345"},
                {"key":"status","value":"STARTED"}
            ]
        }

        fake_notification = json.dumps(notification_content).encode("UTF-8")
        self.client.force_login(user=User.objects.get(username="peter"))
        response = self.client.post(reverse("vs-notifications"), fake_notification, content_type="application/json")

        self.assertEqual(response.status_code, 200)

        final_state = DeliverableAsset.objects.get(pk=1)
        self.assertEqual(final_state.online_item_id, None)
        self.assertEqual(final_state.status, DELIVERABLE_ASSET_STATUS_INGESTING)
        self.assertIsNone(final_state.ingest_complete_dt)