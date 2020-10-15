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