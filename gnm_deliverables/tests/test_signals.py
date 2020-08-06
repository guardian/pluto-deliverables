from django.test import TestCase
import mock
from gnm_deliverables.models import DeliverableAsset, Deliverable
from django.contrib.auth.models import User
import os
import datetime
import pytz

class TestModelSignals(TestCase):
    def setUp(self) -> None:
        if "CI" not in os.environ:
            os.environ["CI"] = 1

    def test_model_saved_create(self):
        """
        ModelSaved should call out to relay_message, passing the instance and
        "create" if the creation flag is true
        """
        with mock.patch("gnm_deliverables.signals.relay_message") as mock_relay_message:
            from gnm_deliverables.signals import model_saved

            fake_instance=DeliverableAsset()

            model_saved(DeliverableAsset.__class__, instance=fake_instance, created=True)
            mock_relay_message.assert_called_with(fake_instance, "create")

    def test_model_saved_update(self):
        """
        ModelSaved should call out to relay_message, passing the instance and
        "update" if the creation flag is false
        """
        with mock.patch("gnm_deliverables.signals.relay_message") as mock_relay_message:
            from gnm_deliverables.signals import model_saved

            fake_instance=DeliverableAsset()

            model_saved(DeliverableAsset.__class__, instance=fake_instance, created=False)
            mock_relay_message.assert_called_with(fake_instance, "update")

    def test_model_deleted(self):
        """
        model_deleted should call out to relay_message, passing the instance and "delete"
        :return:
        """
        with mock.patch("gnm_deliverables.signals.relay_message") as mock_relay_message:
            from gnm_deliverables.signals import model_deleted

            fake_instance=DeliverableAsset()

            model_deleted(DeliverableAsset.__class__, instance=fake_instance)
            mock_relay_message.assert_called_with(fake_instance, "delete")


class TestRelayMessage(TestCase):
    def test_relay_message_asset(self):
        """
        relay_message should send out a serialized version of a DeliverableAsset to the queue
        :return:
        """
        import pika.channel
        from gnm_deliverables.serializers import DeliverableAssetSerializer
        from rest_framework.renderers import JSONRenderer

        mock_channel = mock.MagicMock(pika.channel)
        mock_channel.basic_publish = mock.MagicMock()

        with mock.patch("gnm_deliverables.signals.channel", mock_channel):
            from gnm_deliverables.signals import relay_message
            fake_instance=DeliverableAsset(
                type=1,
                filename='/path/to/somefile',
                absolute_path='/path/to/somefile',
                size=12345,
                access_dt=datetime.datetime(2020,2,3,4,5,6,0,tzinfo=pytz.UTC),
                modified_dt=datetime.datetime(2020,2,3,4,5,6,0,tzinfo=pytz.UTC),
                changed_dt=datetime.datetime(2020,2,3,4,5,6,0,tzinfo=pytz.UTC),
            )

            relay_message(fake_instance,"create")

            expected_output = JSONRenderer().render(DeliverableAssetSerializer(fake_instance).data)

            mock_channel.basic_publish.assert_called_once_with(
                exchange='pluto-deliverables',
                routing_key='deliverables.deliverableasset.create',
                body=expected_output
            )

    def test_relay_message_bundle(self):
        """
        relay_message should send out a serialized version of a Deliverable to the queue
        :return:
        """
        import pika.channel
        from gnm_deliverables.serializers import DeliverableSerializer
        from rest_framework.renderers import JSONRenderer

        mock_channel = mock.MagicMock(pika.channel)
        mock_channel.basic_publish = mock.MagicMock()

        with mock.patch("gnm_deliverables.signals.channel", mock_channel):
            from gnm_deliverables.signals import relay_message
            fake_instance=Deliverable(
                name="test bundle",
                project_id="VX-1234"
            )

            relay_message(fake_instance,"create")

            expected_output = JSONRenderer().render(DeliverableSerializer(fake_instance).data)

            mock_channel.basic_publish.assert_called_once_with(
                exchange='pluto-deliverables',
                routing_key='deliverables.deliverable.create',
                body=expected_output
            )

    def test_relay_message_random(self):
        """
        relay_message should not send out any message for an unrecognised model
        :return:
        """
        import pika.channel

        mock_channel = mock.MagicMock(pika.channel)
        mock_channel.basic_publish = mock.MagicMock()

        with mock.patch("gnm_deliverables.signals.channel", mock_channel):
            from gnm_deliverables.signals import relay_message
            fake_instance=User()

            relay_message(fake_instance,"create")

            mock_channel.basic_publish.assert_not_called()
