from django.test import TestCase
import xml.etree.cElementTree as ET


class TestInmeta(TestCase):
    fixtures = [
        "bundles",
        "assets",
        "users"
    ]

    def test_make_doc(self):
        """
        make_doc should render an XML tree for an asset
        """
        from gnm_deliverables.inmeta import make_doc
        from gnm_deliverables.models import DeliverableAsset
        test_asset = DeliverableAsset.objects.get(pk=37)
        content = make_doc(test_asset, "test")

        tnode = content.find("meta-group/meta[@name='title']")
        self.assertEqual(tnode.attrib["value"], "1018_20130203231700.mp4")
        idnode = content.find("meta-group/meta[@name='itemId']")
        self.assertEqual(idnode.attrib["value"], "VX-36")

    def test_uuid_field(self):
        """
        make_doc should deliver a valid item even if there is a UUID in the gnm_website data
        :return:
        """
        from gnm_deliverables.inmeta import make_doc
        from gnm_deliverables.models import DeliverableAsset,Deliverable,GNMWebsite
        from uuid import UUID
        import xml.etree.cElementTree as ET

        w = GNMWebsite(
            website_title="test one",
            website_description="test one test one",
            primary_tone="test",
            production_office="UK",
            publication_status="Published",
            media_atom_id=UUID("D86340A4-52CF-46C2-92AE-5DDE596CE5F6")
        )

        a = DeliverableAsset(
            online_item_id="VX-1234",
            filename="/path/to/some/file.mxf",
            size=12345678,
            id=99992,
            deliverable=Deliverable(
                pluto_core_project_id=332
            ),
            gnm_website_master=w
        )

        doc = make_doc(a, 'test')
        doc_string = ET.tostring(doc, "UTF-8").decode("UTF-8")
        self.assertIn("meta name=\"gnm_master_mediaatom_atomid\" value=\"d86340a4-52cf-46c2-92ae-5dde596ce5f6\"", doc_string)