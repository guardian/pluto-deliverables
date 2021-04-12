from django.test import TestCase
from rabbitmq.AtomResponderProcessor import AtomResponderProcessor
from mock import patch


class TestAtomResponderProcessor(TestCase):
    fixtures = [
        "atom_responder_test"
    ]

    def test_get_or_create_bundle_existing(self):
        """
        get_or_create_bundle should return an existing bundle that matches the project_id
        :return:
        """
        to_test = AtomResponderProcessor()
        bundle = to_test.get_or_create_bundle("12",9999)
        self.assertEqual(bundle.pk,1)
        self.assertEqual(bundle.commission_id,12)
        self.assertEqual(bundle.name, "gsdfg")

    def test_get_or_create_bundle_new(self):
        """
        get_or_create_bundle should create a new bundle if there is nothign matching the project_id
        :return:
        """
        to_test = AtomResponderProcessor()
        bundle = to_test.get_or_create_bundle("43",9999)
        self.assertNotEqual(bundle.pk,1)
        self.assertEqual(bundle.commission_id,9999)
        self.assertEqual(bundle.name, "Deliverables for 43")

    def test_get_or_create_record(self):
        """
        get_or_create_record should return an existing asset that matches the atom id
        :return:
        """
        to_test = AtomResponderProcessor()
        asset, created = to_test.get_or_create_record("060463c9-d23f-463c-8b81-c2970c0276d5","9999",8888)
        self.assertEqual(asset.pk,1)
        self.assertFalse(created)

    def test_get_or_create_record_noproject(self):
        """
        get_or_create_record should create a special bundle with an id of -1 for incoming masters with no project
        :return:
        """
        to_test = AtomResponderProcessor()
        asset, created = to_test.get_or_create_record("09C38445-6104-4193-BFB6-BF1DE2699E25", None, None)
        self.assertEqual(asset.deliverable.pluto_core_project_id, -1)
        self.assertTrue(created)

    def test_get_or_create_record_create(self):
        """
        get_or_create_record should create a new asset record if nothing matches
        :return:
        """
        from gnm_deliverables.models import Deliverable
        to_test = AtomResponderProcessor()
        asset, created = to_test.get_or_create_record("ec606d8a-748d-49e1-8091-efb59e9c16f1","9999",8888)
        self.assertNotEqual(asset.pk,1)
        self.assertTrue(created)

        new_bundle = Deliverable.objects.get(pluto_core_project_id=9999)
        self.assertNotEqual(new_bundle.pk, 1)
        self.assertEqual(new_bundle, asset.deliverable)

    def test_receive_message_noprojectid(self):
        """
        if a message with no project id is received then it should still be processed and the resulting
        deliverable asset put into the "without projects" bundle (project id -1)
        :return:
        """
        from uuid import UUID
        from gnm_deliverables.models import DeliverableAsset
        fake_content = {
            "title": "no-project-test",
            "type": "video-upload",
            "atomId": "b98cf3c2-f56f-4a01-a2c8-acac4ad1e8d7",
            "itemId": "VX-1234"
        }

        with patch("rabbitmq.AtomResponderProcessor.AtomResponderProcessor.set_vs_metadata") as mock_set_vs_metadata:
            to_test = AtomResponderProcessor()
            to_test.valid_message_receive("test_xchg","message","dhsdjhds", fake_content)

            mock_set_vs_metadata.assert_called_once()
            rec = DeliverableAsset.objects.get(online_item_id="VX-1234")
            self.assertEqual(rec.atom_id,UUID("b98cf3c2-f56f-4a01-a2c8-acac4ad1e8d7"))
            self.assertEqual(rec.deliverable.pluto_core_project_id, -1)