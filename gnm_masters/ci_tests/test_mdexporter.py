# -*- coding: utf-8 -*-
from __future__ import absolute_import
import unittest2
from mock import MagicMock, patch
import httplib
import logging
import os.path
import json
logging.basicConfig(level=logging.DEBUG)


class TestMDExporter(unittest2.TestCase):
    class FakeConnection(object):
        def __init__(self, status, data):
            self.return_status = status
            self.return_data = data

        def request(self, method, body, url, headers):
            pass

        def getresponse(self):
            return TestMDExporter.FakeResponse(200, self.return_data)

    class FakeResponse(object):
        def __init__(self,status, data):
            self.status = status
            self.data = data

        def read(self):
            return self.data

    def test_export_metadata(self):
        import xml.dom.minidom as minidom
        mypath = os.path.dirname(__file__)
        with open(os.path.join(mypath,"testdata","master.xml"), "r") as f:
            test_data = f.read()

        fake_connection = self.FakeConnection(200,test_data)
        fake_connection.request = MagicMock()

        if os.path.exists("/tmp/something.mov.xml"):
            os.unlink("/tmp/something.mov.xml")

        with patch('httplib.HTTPConnection', return_value = fake_connection) as mock_connection:
            from portal.plugins.gnm_masters.mdexporter import export_metadata

            export_metadata("VX-1234","/tmp","something.mov","MyProjection")

            mock_connection.assert_called_once_with("localhost",8080)
            fake_connection.request.assert_called_once_with("GET",
                                                            "/API/item/VX-1234/metadata;projection=MyProjection",
                                                            "",
                                                            {'Content-Type': 'application/xml',
                                                             'Authorization': 'Basic ZmFrZXVzZXI6ZmFrZXBhc3N3b3Jk',
                                                             'Accept': 'application/xml'
                                                             }
                                                            )
            self.assertTrue(os.path.exists("/tmp/something.mov.xml"))
            with open("/tmp/something.mov.xml","r") as fp:
                written_data = fp.read()
            written_data = written_data.decode("utf-8")
            #check that it reads and parses.  TRying to check for equality to the source data is pointless, because it's been
            # parsed and re-written out, so the data is equivalent but not equal, whitespace and entities are messing stuff up.
            parsed = minidom.parseString(written_data.encode("UTF-8"))

    def test_item_information(self):
        mypath = os.path.dirname(__file__)
        with open(os.path.join(mypath,"testdata","iteminfo.json"), "r") as f:
            test_data = f.read()

        fake_connection = self.FakeConnection(200,test_data)
        fake_connection.request = MagicMock()

        with patch('httplib.HTTPConnection', return_value = fake_connection) as mock_connection:
            from portal.plugins.gnm_masters.mdexporter import item_information

            content = item_information("VX-1234",["title","durationSeconds","created"], hide_empty=True,simplify=False)

            mock_connection.assert_called_once_with("localhost",8080)
            fake_connection.request.assert_called_once_with('GET',
                                                            '/API/item/VX-1234/metadata;field=title,durationSeconds,created',
                                                            '',
                                                            {'Authorization': 'Basic ZmFrZXVzZXI6ZmFrZXBhc3N3b3Jk',
                                                             'Accept': 'application/json'}
                                                            )
            self.assertDictContainsSubset({
                'title': [u'Kevin Spacey goes presidential at the Tony awards –  video'],
                'created': ['2017-06-12T06:57:16.410Z'],
                'durationSeconds': ['97.28']
            }, content)

class TestMetaHandlingFunctions(unittest2.TestCase):
    def test_extract_value_normal(self):
        """
        _extract_value should lift a single value out of the json response data
        :return:
        """
        from portal.plugins.gnm_masters.mdexporter import _extract_value

        jsondata ="""{"value": [
                                {
                                    "value": "Do Not Send",
                                    "uuid": "2a31744d-a108-40d8-9504-733d3c3fa1ed",
                                    "user": "smith",
                                    "timestamp": "2017-06-12T08:52:53.587+0000",
                                    "change": "VX-19346938"
                                }
                                ],
                    "name": "field_name"}
                    """
        testdata = json.loads(jsondata)
        result = _extract_value(testdata)
        self.assertEqual(result,['field_name', ['Do Not Send']])

    def test_extract_value_empty(self):
        """
        _extract_value should silently ignore an entry with no value
        :return:
        """
        from portal.plugins.gnm_masters.mdexporter import _extract_value

        jsondata ="""{
                    "name": "field_name"}
                    """
        testdata = json.loads(jsondata)
        result = _extract_value(testdata)
        self.assertEqual(result,['field_name', []])

    def test_extract_value_multiple(self):
        """
        _extract_value should give back a list of multiple options
        :return:
        """
        from portal.plugins.gnm_masters.mdexporter import _extract_value

        jsondata ="""{"value": [
                                {
                                    "value": "Do Not Send",
                                    "uuid": "2a31744d-a108-40d8-9504-733d3c3fa1ed",
                                    "user": "smith",
                                    "timestamp": "2017-06-12T08:52:53.587+0000",
                                    "change": "VX-19346938"
                                },
                                {
                                    "value": "Yes Do Send",
                                    "uuid": "2a31744d-a108-40d8-9504-733d3c3fa1ed",
                                    "user": "smith",
                                    "timestamp": "2017-06-12T08:54:53.587+0000",
                                    "change": "VX-19346939"
                                },
                                {
                                    "value": "Actually Don't Do It",
                                    "uuid": "2a31744d-a108-40d8-9504-733d3c3fa1ed",
                                    "user": "smith",
                                    "timestamp": "2017-06-12T08:55:53.587+0000",
                                    "change": "VX-19346940"
                                },
                                {
                                    "value": "Stop Messing Me Around",
                                    "uuid": "2a31744d-a108-40d8-9504-733d3c3fa1ed",
                                    "user": "smith",
                                    "timestamp": "2017-06-12T08:57:53.587+0000",
                                    "change": "VX-19346940"
                                }
                                ],
                    "name": "field_name"}
                    """
        testdata = json.loads(jsondata)
        result = _extract_value(testdata)
        self.assertEqual(result,['field_name', ['Do Not Send', 'Yes Do Send', 'Actually Don\'t Do It', 'Stop Messing Me Around']])

