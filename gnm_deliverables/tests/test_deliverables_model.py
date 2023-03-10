from django.test import TestCase
import mock


class TestDeliverablesAsset(TestCase):
    def setUp(self):
        pass

    def test_asset_create_placeholder(self):
        """
        create_placeholder should create a placeholder item and save it, provided that there is no item id already
        and commit is true
        :return:
        """
        from gnm_deliverables.models import Deliverable, DeliverableAsset
        from gnm_deliverables.choices import DELIVERABLE_ASSET_TYPE_VIDEO_FULL_MASTER
        with mock.patch("gnmvidispine.vs_item.VSItem.createPlaceholder") as mocked_create_placeholder:
            parent = Deliverable(project_id=1234, name="test")
            asset = DeliverableAsset(
                deliverable=parent,
                type=DELIVERABLE_ASSET_TYPE_VIDEO_FULL_MASTER
            )

            asset.save = mock.MagicMock()
            asset.create_placeholder("fred")
            mocked_create_placeholder.assert_called_once_with('<?xml version=\'1.0\' encoding=\'utf8\'?>\n<MetadataDocument xmlns="http://xml.vidispine.com/schema/vidispine"><timespan end="+INF" start="-INF"><field><name>title</name><value>Full master for test</value></field><group><name>Asset</name><field><name>gnm_category</name><value>Deliverable</value></field><field><name>original_filename</name><value>None</value></field><field><name>gnm_owner</name><value>fred</value></field><field><name>gnm_containing_projects</name><value>None</value></field><field><name>gnm_file_created</name><value>None</value></field></group><group><name>Deliverable</name><field><name>gnm_deliverable_bundle</name><value>None</value></field><field><name>gnm_deliverable_id</name><value>None</value></field></group></timespan></MetadataDocument>')
            asset.save.assert_called_once()

    def test_asset_create_placeholder_existing(self):
        """
        create_placeholder shoul default to no-op if there is already an item id set
        :return:
        """
        from gnm_deliverables.models import Deliverable, DeliverableAsset

        with mock.patch("gnmvidispine.vs_item.VSItem.createPlaceholder") as mocked_create_placeholder:
            parent = Deliverable(project_id=1234, name="test")
            asset = DeliverableAsset(
                deliverable=parent,
                online_item_id="VX-12354"
            )

            asset.save = mock.MagicMock()
            asset.create_placeholder("fred")
            mocked_create_placeholder.assert_not_called()
            asset.save.assert_not_called()

    def test_asset_start_file_import(self):
        """
        start_file_import should call out to gnmvidispine to start importing a file, not creating a placeholder if
         an item already exists.  job_id should be set from the returned job.
        :return:
        """
        from gnmvidispine.vs_item import VSItem
        from gnmvidispine.vs_job import VSJob
        from gnm_deliverables.models import Deliverable, DeliverableAsset, ImportFailedError
        parent = Deliverable(project_id=1234, name="test")
        asset = DeliverableAsset(
            deliverable=parent,
            online_item_id="VX-12345",
            absolute_path="file:///path/to/some/file.mp4"
        )

        mocked_job = mock.MagicMock(VSJob)
        mocked_job.name = "VX-345"
        mocked_item = mock.MagicMock(VSItem)
        asset.create_placeholder = mock.MagicMock()
        asset.item = mock.MagicMock(return_value=mocked_item)
        mocked_item.import_to_shape = mock.MagicMock(return_value=mocked_job)
        asset.save = mock.MagicMock()

        asset.start_file_import("testuser")

        asset.item.assert_called_once_with(user="testuser")
        asset.save.assert_called_once()
        mocked_item.import_to_shape.assert_called_once_with(essence=True,
                                                            jobMetadata={'import_source': 'pluto-deliverables',
                                                                         'project_id': 'None',
                                                                         'asset_id': 'None'},
                                                            noTranscode=False,
                                                            priority='MEDIUM',
                                                            thumbnails=False,
                                                            uri='file://file:///path/to/some/file.mp4')

        self.assertEqual(asset.job_id, "VX-345")

    def test_asset_item(self):
        """
        item() should call out to gnmvidispine to populate an item and return it
        :return:
        """
        from gnm_deliverables.models import Deliverable, DeliverableAsset, ImportFailedError

        with mock.patch("gnmvidispine.vs_item.VSItem.populate") as mock_item_populate:
            parent = Deliverable(project_id=1234, name="test")
            asset = DeliverableAsset(
                deliverable=parent,
                online_item_id="VX-12345",
                absolute_path="file:///path/to/some/file.mp4"
            )

            result = asset.item("testuser")
            mock_item_populate.assert_called_once_with("VX-12345")
            self.assertEqual(result.populate, mock_item_populate)   #I can't think of another way of testing the return value

    def test_asset_item_cached(self):
        """
        item() should not call out to gnmvidispine if it already has a cached copy
        :return:
        """
        from gnmvidispine.vs_item import VSItem
        from gnm_deliverables.models import Deliverable, DeliverableAsset, ImportFailedError

        with mock.patch("gnmvidispine.vs_item.VSItem.populate") as mock_item_populate:
            parent = Deliverable(project_id=1234, name="test")
            asset = DeliverableAsset(
                deliverable=parent,
                online_item_id="VX-12345",
                absolute_path="file:///path/to/some/file.mp4"
            )

            mocked_vsitem = mock.MagicMock(VSItem)
            asset._set_cached_item( mocked_vsitem)

            result = asset.item("testuser")
            mock_item_populate.assert_not_called()
            self.assertEqual(result, mocked_vsitem)