from rest_framework.test import APIClient
from django.test import TestCase
from django.contrib.auth.models import User
from gnm_deliverables.models import *
import json


class TestPlatformLogUpdate(TestCase):
    fixtures = [
        "users",
        "bundles",
        "assets"
    ]

    def test_log_update(self):
        """
        PlatformLogupdate view should add a log entry for the given record
        :return:
        """
        user = User.objects.get(username='admin')
        asset = DeliverableAsset.objects.get(pk=37)

        self.assertNotEqual(asset.mainstream_master.upload_status,"Uploading")
        pre_existing_records = LogEntry.objects.filter(related_mainstream=asset.mainstream_master)
        self.assertEqual(len(pre_existing_records), 0)
        client = APIClient()
        client.force_authenticate(user)
        testbody = {"sender": "test","log": "test log line"}

        response = client.post("/api/bundle/4444/asset/37/mainstream/logupdate", data=testbody, format="json")
        self.assertEqual(response.status_code, 200)

        new_records = LogEntry.objects.filter(related_mainstream=asset.mainstream_master)
        self.assertEqual(len(new_records), 1)
        self.assertEqual(new_records[0].log_line, "test log line")
        self.assertEqual(new_records[0].sender, "test")
        updated_asset = DeliverableAsset.objects.get(pk=37)
        self.assertEqual("Uploading", updated_asset.mainstream_master.upload_status)

    def test_log_completed(self):
        """
        PlatformLogupdate view should add a log entry for the given record and mark completed if the request says so
        :return:
        """
        user = User.objects.get(username='admin')
        asset = DeliverableAsset.objects.get(pk=37)

        self.assertNotEqual(asset.mainstream_master.upload_status,"Upload Complete")
        pre_existing_records = LogEntry.objects.filter(related_mainstream=asset.mainstream_master)
        self.assertEqual(len(pre_existing_records), 0)
        client = APIClient()
        client.force_authenticate(user)
        testbody = {"sender": "test","log": "test log line", "completed": True, "failed": False}

        response = client.post("/api/bundle/4444/asset/37/mainstream/logupdate", data=testbody, format="json")
        self.assertEqual(response.status_code, 200)

        new_records = LogEntry.objects.filter(related_mainstream=asset.mainstream_master)
        self.assertEqual(len(new_records), 1)
        self.assertEqual(new_records[0].log_line, "test log line")
        self.assertEqual(new_records[0].sender, "test")
        updated_asset = DeliverableAsset.objects.get(pk=37)
        self.assertEqual("Upload Complete", updated_asset.mainstream_master.upload_status)

    def test_log_failed(self):
        """
        PlatformLogupdate view should add a log entry for the given record and mark failed if the request says so
        :return:
        """
        user = User.objects.get(username='admin')
        asset = DeliverableAsset.objects.get(pk=37)

        self.assertNotEqual(asset.mainstream_master.upload_status,"Upload Failed")
        pre_existing_records = LogEntry.objects.filter(related_mainstream=asset.mainstream_master)
        self.assertEqual(len(pre_existing_records), 0)
        client = APIClient()
        client.force_authenticate(user)
        testbody = {"sender": "test","log": "test log line", "completed": True, "failed": True}

        response = client.post("/api/bundle/4444/asset/37/mainstream/logupdate", data=testbody, format="json")
        self.assertEqual(response.status_code, 200)

        new_records = LogEntry.objects.filter(related_mainstream=asset.mainstream_master)
        self.assertEqual(len(new_records), 1)
        self.assertEqual(new_records[0].log_line, "test log line")
        self.assertEqual(new_records[0].sender, "test")
        updated_asset = DeliverableAsset.objects.get(pk=37)
        self.assertEqual("Upload Failed", updated_asset.mainstream_master.upload_status)