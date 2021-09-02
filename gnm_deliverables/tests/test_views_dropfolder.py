from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from django.contrib.auth.models import User
from mock import MagicMock, patch
import json


class TestGetDropfolderView(APITestCase):
    fixtures = [
        "assets",
        "bundles",
        "users"
    ]

    def test_check_dropfolder(self):
        """
        calling GET on dropfolder should call out to create_folder_for_deliverable() and return the folder path
        in a 200 response
        :return:
        """
        with patch("gnm_deliverables.models.create_folder_for_deliverable") as mock_create_deliverable:
            client = APIClient()
            client.force_authenticate(User.objects.get(pk=1))
            response = client.get(reverse('dropfolder', kwargs={"project_id": 3333}))
            mock_create_deliverable.assert_called_once_with("Clean Test")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["status"],"ok")
            self.assertEqual(response.data["clientpath"],"/Volumes/shared/Clean Test")

    def test_check_dropfolder_notexist(self):
        """
        calling GET on dropfolder should return a 404 if the bundle does not exist
        :return:
        """
        with patch("gnm_deliverables.models.create_folder_for_deliverable") as mock_create_deliverable:
            client = APIClient()
            client.force_authenticate(User.objects.get(pk=1))
            response = client.get(reverse('dropfolder', kwargs={"project_id": 64362473}))
            mock_create_deliverable.assert_not_called()
            self.assertEqual(response.status_code, 404)

    def test_check_dropfolder_error(self):
        """
        calling GET on dropfolder should return a 500 if there is a problem
        :return:
        """
        with patch("gnm_deliverables.models.create_folder_for_deliverable", side_effect=RuntimeError("splat")) as mock_create_deliverable:
            client = APIClient()
            client.force_authenticate(User.objects.get(pk=1))
            response = client.get(reverse('dropfolder', kwargs={"project_id": 3333}))
            mock_create_deliverable.assert_called_once_with("Clean Test")
            self.assertEqual(response.status_code, 500)