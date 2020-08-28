import json

from django.test import TestCase
from django.urls import reverse
from rest_framework import status

from gnm_deliverables.models import DeliverableAsset, GNMWebsite, Deliverable
from gnm_deliverables.serializers import GNMWebsiteSerializer


class TestGetInMetadataView(TestCase):
    def setUp(self) -> None:
        self.gnmwebsite = GNMWebsite.objects.create(website_title='test.com')
        self.deliverable = Deliverable.objects.create(pluto_core_project_id=1, commission_id=1)
        self.asset = DeliverableAsset.objects.create(deliverable=self.deliverable,
                                                     gnm_website_master=self.gnmwebsite, pk=1)

        self.not_valid_etag = {
            'website_title': 'testing.com',
            'etag': '2020-08-28T08:07:19.775337Z'
        }

        self.youtube_object = {

            "youtube_id": "testvideo",
            "youtube_title": "test"
        }

    def tearDown(self) -> None:
        pass

    def test_get_metadata(self):
        c = self.client
        response = c.get(reverse('gnmwebsite',
                                 kwargs={'project_id': self.deliverable.pluto_core_project_id,
                                         'asset_id': self.asset.pk}))

        metadata = GNMWebsite.objects.get(website_title=self.gnmwebsite.website_title)

        serializer = GNMWebsiteSerializer(metadata)

        self.assertEqual(response.data, serializer.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_metadata_from_nonexistent_asset(self):
        c = self.client
        response = c.get(reverse('gnmwebsite',
                                 kwargs={'project_id': self.deliverable.pluto_core_project_id,
                                         'asset_id': 13}))

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class TestPutInMetadataView(TestCase):
    def setUp(self) -> None:
        self.deliverable = Deliverable.objects.create(pluto_core_project_id=1, commission_id=1)
        self.asset = DeliverableAsset.objects.create(deliverable=self.deliverable, pk=1)

        self.new_gnmwebsite = {
            'website_title': 'testing.com'
        }

        self.update_gnmwebsite_with_wrong_etag = {
            'website_title': 'testing.com',
            'website_description': 'description',
            'etag': '2020-08-28T08:07:19.775337Z'}

    def test_create_metadata(self):
        c = self.client

        response = c.put(reverse('gnmwebsite',
                                 kwargs={'project_id': self.deliverable.pluto_core_project_id,
                                         'asset_id': self.asset.pk}),
                         json.dumps(self.new_gnmwebsite),
                         content_type='application/json'
                         )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_metadata_with_wrong_etag(self):
        c = self.client

        response = c.put(reverse('gnmwebsite',
                                 kwargs={'project_id': self.deliverable.pluto_core_project_id,
                                         'asset_id': self.asset.pk}),
                         json.dumps(self.update_gnmwebsite_with_wrong_etag),
                         content_type='application/json'
                         )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)

    def test_update_website(self):
        c = self.client

        resp = c.put(reverse('gnmwebsite',
                             kwargs={'project_id': self.deliverable.pluto_core_project_id,
                                     'asset_id': self.asset.pk}),
                     json.dumps(self.new_gnmwebsite),
                     content_type='application/json'
                     )

        etag = resp.data['data'].get('etag')
        updated_gnmwebsite = {'website_title': 'testing.com',
                              'website_description': 'description',
                              'etag': etag}

        response = c.put(reverse('gnmwebsite',
                                 kwargs={'project_id': self.deliverable.pluto_core_project_id,
                                         'asset_id': self.asset.pk}),
                         json.dumps(updated_gnmwebsite),
                         content_type='application/json'
                         )

        expected_response = updated_gnmwebsite

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data'].get('website_description'),
                         updated_gnmwebsite['website_description'])

        # Etag should have updated value
        self.assertNotEqual(response.data['data'].get('etag'), etag)

    def test_update_website_with_wrong_asset(self):
        c = self.client

        resp = c.put(reverse('gnmwebsite',
                             kwargs={'project_id': self.deliverable.pluto_core_project_id,
                                     'asset_id': 13}),
                     json.dumps(self.new_gnmwebsite),
                     content_type='application/json'
                     )

        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class TestDeleteInMetadataAPIView(TestCase):

    def setUp(self) -> None:
        self.deliverable = Deliverable.objects.create(pluto_core_project_id=1, commission_id=1)
        self.gnmwebsite = GNMWebsite.objects.create(website_title='test.com')
        self.asset = DeliverableAsset.objects.create(deliverable=self.deliverable, pk=1,
                                                     gnm_website_master=self.gnmwebsite)

    def test_delete_metadata(self):
        c = self.client

        response = c.delete(reverse('gnmwebsite',
                                    kwargs={'project_id': self.deliverable.pluto_core_project_id,
                                            'asset_id': self.asset.pk}))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_delete_metadata_with_nonexisting_asset(self):
        c = self.client

        response = c.delete(reverse('gnmwebsite',
                                    kwargs={'project_id': self.deliverable.pluto_core_project_id,
                                            'asset_id': 12}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
