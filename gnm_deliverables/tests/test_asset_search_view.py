from rest_framework.test import APITestCase, APIClient
from django.urls import reverse
from django.contrib.auth.models import User


class TestAssetSearchView(APITestCase):
    fixtures = [
        "assets",
        "bundles",
        "users"
    ]

    def test_asset_search_view_filename(self):
        """
        asset search view should return hits for a filename search in title
        :return:
        """
        client = APIClient()
        client.force_authenticate(User.objects.get(pk=1))
        response = client.post(reverse('asset-search'), {"title":"comdey1.mov"}, format="json")

        self.assertEqual(200, response.status_code)

        self.assertEqual(2, len(response.data))
        self.assertEqual("comdey1.mov", response.data[0]["filename"])
        self.assertEqual("comdey1.mov", response.data[1]["filename"])
        self.assertEqual(39, response.data[0]["id"])
        self.assertEqual(40, response.data[1]["id"])

    def test_asset_search_view_title(self):
        """
        asset search view should also search title field for platform titles
        :return:
        """
        client = APIClient()
        client.force_authenticate(User.objects.get(pk=1))
        response = client.post(reverse('asset-search'), {"title":"Test mainstream title"}, format="json")

        self.assertEqual(200, response.status_code)

        self.assertEqual(1, len(response.data))
        self.assertEqual("1018_20130203231700.mp4", response.data[0]["filename"])
        self.assertEqual(37, response.data[0]["id"])

    def test_asset_search_view_atomid(self):
        """
        asset search view should search the atomid field
        :return:
        """
        client = APIClient()
        client.force_authenticate(User.objects.get(pk=1))
        response = client.post(reverse('asset-search'), {"atom_id":"ed94ddcb-1a9a-4081-89c2-432c7db123d9"}, format="json")

        self.assertEqual(200, response.status_code)

        self.assertEqual(1, len(response.data))
        self.assertEqual("some kinda test", response.data[0]["filename"])
        self.assertEqual(674, response.data[0]["id"])

    def test_asset_search_view_atomid_invalid(self):
        """
        asset search view should return bad request if the atom_id field is not a uuid
        :return:
        """
        client = APIClient()
        client.force_authenticate(User.objects.get(pk=1))
        response = client.post(reverse('asset-search'), {"atom_id":"not-a-uuid"}, format="json")

        self.assertEqual(400, response.status_code)