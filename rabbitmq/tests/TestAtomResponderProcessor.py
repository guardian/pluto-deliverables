from django.test import TestCase
from rabbitmq.AtomResponderProcessor import AtomResponderProcessor


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