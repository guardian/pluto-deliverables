import mock
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from gnm_deliverables.models import DeliverableAsset, GNMWebsite
from gnm_deliverables.serializers import GNMWebsiteSerializer
from gnm_deliverables.views import GNMWebsiteAPIView


class TestDeliverablesView(TestCase):
    def setUp(self) -> None:
        pass

    def tearDown(self) -> None:
        pass
        # from gnm_deliverables.models import Deliverable, DeliverableAsset
        # for asset in DeliverableAsset.objects.filter(deliverable=4567):
        #     asset.delete()
        # try:
        #     d = Deliverable.objects.get(project_id=4567)
        #     d.delete()
        # except Deliverable.DoesNotExist:
        #     pass


    def test_get_metadata(self):
        asset = mock.Mock(DeliverableAsset, name='test', pk=1)
        project_id = 1
        gnm_serializer = mock.Mock(GNMWebsiteSerializer)
        gnmwebsite = mock.Mock(GNMWebsite, website_title='title.com',
                               etag='2020-08-26T09:27:49.119413Z')
        with mock.patch("gnm_deliverables.models.GNMWebsite.objects.get") as mock_metadata, \
             mock.patch("gnm_deliverables.serializers.GNMWebsiteSerializer") as mock_serializer:

            mock_metadata.return_value = gnmwebsite
            mock_serializer.return_value.data.return_value = {
                "website_title": "title.com",
                "etag": "2020-08-26T09:27:49.119413Z"
            }
            factory = APIRequestFactory()
            user = User.objects.create_user(
                'user01', 'user01@example.com', 'user01P4ssw0rD')

            request_endpoint = '/api/bundle/{}/asset/{}/gnmwebsite'.format(project_id, asset.pk)

            request = factory.get(request_endpoint)
            force_authenticate(request, user=user)
            view = GNMWebsiteAPIView.as_view()
            response = view(request, project_id=project_id, asset_id=asset.pk)

            expected_response = {
                "website_title": "title.com",
                "etag": "2020-08-26T09:27:49.119413Z"
            }
            self.assertEqual(response.data, expected_response)
