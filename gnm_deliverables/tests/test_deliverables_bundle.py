import json
from collections import namedtuple
from datetime import datetime

import mock
import pytz
from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from gnm_deliverables.models import Deliverable
from gnm_deliverables.views.views import CountDeliverablesView, NewDeliverablesAPICreate, DeliverableAPIStarted


class TestDeliverablesBundle(TestCase):
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

    def test_sync_assets(self):
        """
        sync_assets_from_filesystem should create a DeliverableAsset for each file found on the filesystem
        :return:
        """
        FileInfo = namedtuple('FileInfo',
                              'absolute_path path size access_dt modified_dt changed_dt')
        files_date = datetime(2020, 4, 5, 6, 7, 8, tzinfo=pytz.timezone("Europe/London"))

        def mock_find_files(for_name):
            i = 1

            for f in ["file1.mp4", "file2.jpg", "file3.mxf", "file4.aiff"]:
                yield FileInfo(
                    absolute_path="file:///path/to/media/{0}".format(f),
                    path="/path/to/media/{0}".format(f),
                    size=i * 502,
                    access_dt=files_date,
                    modified_dt=files_date,
                    changed_dt=files_date
                )
                i += 1

        with mock.patch("gnm_deliverables.models.find_files_for_deliverable",
                        side_effect=mock_find_files) as find_files_for_deliverable:
            from gnm_deliverables.models import Deliverable, DeliverableAsset
            d = Deliverable(project_id=4567, name="some test", commission_id=7654,
                            pluto_core_project_id=9898)
            d.save()

            result = d.sync_assets_from_file_system()

            find_files_for_deliverable.assert_called_once_with("some test")
            self.assertEqual(result, {"added": 4, "removed": 0})

            added_assets = [x for x in DeliverableAsset.objects.filter(deliverable=d)]
            self.assertEqual(4, len(added_assets))
            check_item = [a for a in added_assets if a.filename.endswith('file3.mxf')][0]
            self.assertEqual(check_item.filename, "/path/to/media/file3.mxf")
            self.assertEqual(check_item.absolute_path, "file:///path/to/media/file3.mxf")
            self.assertEqual(check_item.size, 1506)
            self.assertEqual(check_item.access_dt, files_date)
            self.assertEqual(check_item.modified_dt, files_date)
            self.assertEqual(check_item.changed_dt, files_date)

    def test_count_assets(self):
        deliverable = mock.Mock(Deliverable, project_id=2, name='test', pk=1)

        with mock.patch("gnm_deliverables.models.Deliverable.objects.get") as mock_deliverable, \
                mock.patch(
                    "gnm_deliverables.models.DeliverableAsset.objects.filter") as mock_assets:
            mock_deliverable.return_value = deliverable
            mock_assets.return_value.count.return_value = 2

            factory = APIRequestFactory()
            user = User.objects.create_user(
                'user01', 'user01@example.com', 'user01P4ssw0rD')

            request_endpoint = '/api/bundle/{}/count'.format(deliverable.project_id)

            request = factory.get(request_endpoint)
            force_authenticate(request, user=user)
            view = CountDeliverablesView.as_view()
            response = view(request, project_id=deliverable.project_id)

            expected_response = {"total_asset_count": 2, "unimported_asset_count": 6}
            self.assertEqual(response.data, expected_response)

    def test_started(self):
        deliverable = mock.Mock(Deliverable, project_id=2, name='test', pk=1, pluto_core_project_id=2)

        with mock.patch("gnm_deliverables.models.Deliverable.objects.get") as mock_deliverable:
            mock_deliverable.return_value = deliverable

            factory = APIRequestFactory()
            user = User.objects.create_user(
                'user01', 'user01@example.com', 'user01P4ssw0rD')

            request_endpoint = '/api/bundle/started?project_id={0}'.format(deliverable.pluto_core_project_id)

            request = factory.get(request_endpoint)
            force_authenticate(request, user=user)
            view = DeliverableAPIStarted.as_view()
            response = view(request)

            expected_response = {"ingests_started": False}
            self.assertEqual(response.data, expected_response)


class TestPostNewDeliverableBundle(TestCase):

    def setUp(self) -> None:
        self.deliverable = {
            "project_id": "1",
            "pluto_core_project_id": 1,
            "commission_id": 1,
            "name": "testbundle"
        }
        self.user = User.objects.create_user(
            'user01', 'user01@example.com', 'user01P4ssw0rD')

    def test_create_bundle_and_asset_folder(self):

        with mock.patch("gnm_deliverables.files.create_folder") as mock_create_folder:
            mock_create_folder.return_value = '/media/shared/testbundle', True
            factory = APIRequestFactory()

            request = factory.post(reverse('bundle-create'),
                                   json.dumps(self.deliverable),
                                   content_type='application/json'
                                   )
            force_authenticate(request, user=self.user)
            view = NewDeliverablesAPICreate.as_view()
            response = view(request)
            mock_create_folder.assert_called_once()

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['data'].get('local_path'), '/Volumes/shared/testbundle')

    def test_create_bundle_and_asset_folder_already_exists(self):
        with mock.patch("gnm_deliverables.files.create_folder") as mock_create_folder:
            mock_create_folder.return_value = '/media/shared/testbundle', False
            factory = APIRequestFactory()

            request = factory.post(reverse('bundle-create'),
                                   json.dumps(self.deliverable),
                                   content_type='application/json'
                                   )
            force_authenticate(request, user=self.user)
            view = NewDeliverablesAPICreate.as_view()
            response = view(request)
            mock_create_folder.assert_called_once()

            self.assertEqual(response.status_code, status.HTTP_200_OK)
