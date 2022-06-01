from django.test import TestCase
from unittest.mock import MagicMock
from rabbitmq.item_notification import ItemNotification


class TestVidispineItemProcessor(TestCase):
    fixtures = [
        "vidispine_message_tests"
    ]

    def test_item_notification(self):
        """
        handle_notification should set the asset online_item_id field to a blank string
        :return:
        """
        from rabbitmq.vidispine_item_processor import VidispineItemProcessor
        from gnm_deliverables.models import DeliverableAsset

        record_before = DeliverableAsset.objects.get(id=1)
        self.assertEqual(record_before.online_item_id, "VX-41")

        mock_notification = MagicMock(target=ItemNotification)
        mock_notification.action = "DELETE"
        mock_notification.itemId = "VX-41"
        to_test = VidispineItemProcessor()
        to_test.handle_notification(mock_notification)

        record_after = DeliverableAsset.objects.get(id=1)
        self.assertEqual(record_after.online_item_id, "")
