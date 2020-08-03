# coding: utf-8
from portal.plugins.gnm_misc_utils.test_base import SemiAutomaticCleanupTestBase
from portal.plugins.gnm_vidispine_utils import md_utils
from lxml import etree as ET


class UtilsTest(SemiAutomaticCleanupTestBase):

    def setUp(self, *args, **kwargs):
        super(UtilsTest, self).setUp(*args, **kwargs)
        self.fieldgroup_xml = """
<MetadataFieldGroupDocument xmlns="http://xml.vidispine.com/schema/vidispine">
<name>Commission</name>
<schema min="0" max="-1" name="Commission"/>
<field>
<name>gnm_commission_commissioner</name>
<schema min="0" max="-1" name="gnm_commission_commissioner"/>
<type>string-exact</type>
<stringRestriction/>
<data>
<key>extradata</key>
<value>
{"name": "Commissioner", "default": "", "description": "", "Commission": {"required": true, "hideifnotset": false, "representative": false}, "readonly": false, "values": [{"value": "Commissioner Gordon", "key": "1"}, {"value": "Batman", "key": "2"}, {"value": "Pippi", "key": "3"}], "externalid": "", "type": "dropdown", "reusable": false}
</value>
</data>
<defaultValue/>
<origin>VX</origin>
</field>
</MetadataFieldGroupDocument>"""

        self.md_xml = """<MetadataListDocument xmlns="http://xml.vidispine.com/schema/vidispine">
<item id="VX-1">
<metadata>
<revision>
VX-6,VX-19,VX-20,VX-21,VX-22,VX-9,VX-7,VX-11,VX-12,VX-13,VX-29,VX-16,VX-17
</revision>
<group>Film</group>
<timespan start="-INF" end="+INF">
<field uuid="d9921fd2-132d-4019-a741-6ab8ce0df24c" user="admin" timestamp="2014-04-23T13:55:14.872+02:00" change="VX-22">
<name>testfield</name>
<value uuid="baa9dede-8691-41be-9d82-330a8dfcce7c" user="admin" timestamp="2014-04-23T13:55:14.872+02:00" change="VX-22">testar</value>
<value uuid="37aa491e-1c59-4026-abb6-1e0288916eeb" user="admin" timestamp="2014-04-23T13:55:14.872+02:00" change="VX-22">hejsan</value>
<value uuid="12e877d3-4d1f-477a-ad08-5274f2fe49da" user="admin" timestamp="2014-04-23T13:55:14.872+02:00" change="VX-22">hopp</value>
</field>
</timespan>
</metadata>
</item>
</MetadataListDocument>"""

    def test_find_field(self):
        doc = ET.fromstring(self.md_xml)
        field = md_utils.find_field(doc, 'testfield')

        self.assertTrue(field is not None)
        self.assertEqual(field.attrib.get('uuid'), 'd9921fd2-132d-4019-a741-6ab8ce0df24c')

    def test_get_inf_timespan(self):
        doc = ET.fromstring(self.md_xml)
        ts = md_utils.get_inf_timespan(doc)

        self.assertTrue(ts is not None)
        self.assertEqual(ts.attrib.get('start'), '-INF')
