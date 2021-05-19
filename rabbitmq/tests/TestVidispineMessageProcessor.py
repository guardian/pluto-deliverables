from django.test import TestCase
from unittest.mock import MagicMock, patch
from rabbitmq.job_notification import JobNotification
import gnm_deliverables.choices as choices


class TestVidispineMessageProcessor(TestCase):
    fixtures = [
        "vidispine_message_tests"
    ]

    def test_handle_notification_failedtotal(self):
        """
        handle_notification should set the asset status to DELIVERABLE_ASSET_STATUS_INGEST_FAILED if the status is
        FAILED_TOTAL
        :return:
        """
        from rabbitmq.vidispine_message_processor import VidispineMessageProcessor
        from gnm_deliverables.models import DeliverableAsset

        record_before = DeliverableAsset.objects.get(job_id="VX-99998")
        self.assertEqual(record_before.status, choices.DELIVERABLE_ASSET_STATUS_INGESTING)

        mock_notification = MagicMock(target=JobNotification)
        mock_notification.status = "FAILED_TOTAL"
        mock_notification.jobId = "VX-99998" #corresponds to fixture
        to_test = VidispineMessageProcessor()
        to_test.handle_notification(mock_notification, "vidispine.job.essence_version.stop")

        record_after = DeliverableAsset.objects.get(job_id="VX-99998")
        self.assertEqual(record_after.status, choices.DELIVERABLE_ASSET_STATUS_INGEST_FAILED)

    def test_handle_notification_aborted(self):
        """
        handle_notification should set the asset status to DELIVERABLE_ASSET_STATUS_INGEST_FAILED if the status is
        ABORTED
        :return:
        """
        from rabbitmq.vidispine_message_processor import VidispineMessageProcessor
        from gnm_deliverables.models import DeliverableAsset
        from gnmvidispine.vs_item import VSItem
        record_before = DeliverableAsset.objects.get(job_id="VX-99998")
        print(record_before.__dict__)
        self.assertEqual(record_before.status, choices.DELIVERABLE_ASSET_STATUS_INGESTING)

        mock_item = MagicMock(target=VSItem)
        mock_item.populate = MagicMock()
        mock_item.create_proxy = MagicMock()

        with patch("gnm_deliverables.models.VSItem", mock_item):
            mock_notification = MagicMock(target=JobNotification)
            mock_notification.status = "ABORTED"
            mock_notification.jobId = "VX-99998" #corresponds to fixture
            to_test = VidispineMessageProcessor()
            to_test.handle_notification(mock_notification, "vidispine.job.essence_version.stop")

            record_after = DeliverableAsset.objects.get(job_id="VX-99998")
            self.assertEqual(record_after.status, choices.DELIVERABLE_ASSET_STATUS_INGEST_FAILED)

            self.assertEqual(mock_item.create_proxy.call_count, 0)

    def test_handle_notification_finishedwarning(self):
        """
        handle_notification should set the asset status to DELIVERABLE_ASSET_STATUS_TRANSCODED if the status is
        FINISHED_WARNING and the type is
        :return:
        """
        from rabbitmq.vidispine_message_processor import VidispineMessageProcessor
        from gnm_deliverables.models import DeliverableAsset

        with patch("gnm_deliverables.models.DeliverableAsset.create_proxy") as mock_create_proxy:
            record_before = DeliverableAsset.objects.get(job_id="VX-99998")
            self.assertEqual(record_before.status, choices.DELIVERABLE_ASSET_STATUS_INGESTING)

            mock_notification = MagicMock(target=JobNotification)
            mock_notification.status = "FINISHED_WARNING"
            mock_notification.type = choices.DELIVERABLE_ASSET_TYPE_OTHER_PAC_FORMS
            mock_notification.itemId = "VX-43"
            mock_notification.jobId = "VX-99998" #corresponds to fixture
            to_test = VidispineMessageProcessor()
            to_test.handle_notification(mock_notification, "vidispine.job.essence_version.stop")

            record_after = DeliverableAsset.objects.get(job_id="VX-99998")

            mock_create_proxy.assert_not_called()
            self.assertEqual(record_after.status, choices.DELIVERABLE_ASSET_STATUS_TRANSCODED)
