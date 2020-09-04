from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from mock import patch
import json


class TestCountDeliverablesAPIView(TestCase):
    fixtures = [
        "assets.yaml",
        "bundles.yaml",
        "users.yaml"
    ]

    def test_count_deliverables_notfound(self):
        """
        deliverables count endpoint should return a 404 if the requested bundle does not exist
        :return:
        """
        user = User.objects.get(username="peter")
        client = APIClient()
        client.force_authenticate(user)

        response = client.get("/api/bundle/543534/count")
        self.assertEqual(response.status_code, 404)

    def test_count_deliverables_empty(self):
        """
        deliverables count endpoint should return valid data if the requested bundle exists with no assets
        :return:
        """
        user = User.objects.get(username="peter")
        client = APIClient()
        client.force_authenticate(user)

        response = client.get("/api/bundle/1/count")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"total_asset_count": 0, "unimported_asset_count": 0})

    def test_count_deliverables_populated(self):
        """
        deliverables count endpoint should return asset counts
        :return:
        """
        user = User.objects.get(username="peter")
        client = APIClient()
        client.force_authenticate(user)

        response = client.get("/api/bundle/3333/count")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"total_asset_count": 3, "unimported_asset_count": 0})


class TestCreateBundle(TestCase):
    fixtures = [
        "assets.yaml",
        "bundles.yaml",
        "users.yaml"
    ]

    def test_create_bundle_duplicate(self):
        """
        you should not be able to create a second bundle with the same project id as an existing one
        :return:
        """
        user = User.objects.get(username="peter")
        client = APIClient()
        client.force_authenticate(user)

        with patch("gnm_deliverables.files.create_folder_for_deliverable") as mock_create_folder:
            test_record = {"pluto_core_project_id":3333,
                           "commission_id":999,
                           "name":"Test",
                           "created":"2020-01-02T03:04:05Z"
                           }
            response = client.post("/api/bundle/new", data=json.dumps(test_record), content_type='application/json')
            self.assertEqual(response.status_code, 409)
            mock_create_folder.assert_not_called()

    def test_create_bundle_invalid(self):
        """
        create bundle endpoint should return a 400 error if the data is not valid
        :return:
        """
        user = User.objects.get(username="peter")
        client = APIClient()
        client.force_authenticate(user)

        with patch("gnm_deliverables.files.create_folder_for_deliverable") as mock_create_folder:
            test_record = {"pluto_core_project_id":"something wrong here",
                           "commission_id":999,
                           "name":"Test",
                           "created":"2020-01-02T03:04:05Z"
                           }
            response = client.post("/api/bundle/new", data=json.dumps(test_record), content_type='application/json')
            self.assertEqual(response.status_code, 400)
            mock_create_folder.assert_not_called()