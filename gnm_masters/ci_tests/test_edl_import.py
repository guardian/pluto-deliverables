import django.test
from mock import MagicMock, patch
import os
import hashlib


def checksum(fname):
    hasher = hashlib.sha256()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


class TestUpdateEDLData(django.test.TestCase):
    def test_update_edl_data(self):
        """
        update_edl_data should read in EDL data and push to vidispine/file
        :return:
        """
        from django.contrib.auth.models import User
        from celery.result import AsyncResult

        mock_user = MagicMock(target=User)
        mock_task = MagicMock(target=AsyncResult)

        def sourcepath():
            return os.path.abspath(os.path.dirname(__file__))

        sourcefile = os.path.join(sourcepath(),"testdata","samplefcp.xml")

        with patch('portal.plugins.gnm_vidispine_utils.vs_calls') as mock_vscalls:
            with patch('portal.plugins.gnm_vidispine_errors.error_handling.is_error', return_value=False):
                with patch('portal.plugins.gnm_masters.tasks.update_pacdata.delay', return_value=mock_task) as mock_task_call:
                    from portal.plugins.gnm_masters.edl_import import update_edl_data
                    mock_vscalls.put = MagicMock()

                    with open(sourcefile) as f:
                        update_edl_data(f,"VX-1234",mock_user,retries=1,retry_delay=1)
                    mock_task_call.assert_called_once_with("/tmp/master_VX-1234_edldata.xml","VX-1234",mock_user)

                    mock_vscalls.put.assert_called_once_with('item/VX-1234/metadata', '<ns0:MetadataDocument xmlns:ns0="http://xml.vidispine.com/schema/vidispine"><ns0:timespan end="+INF" start="-INF"><ns0:field><ns0:name>gnm_master_pacdata_status</ns0:name><ns0:value>processing</ns0:value></ns0:field></ns0:timespan></ns0:MetadataDocument>', mock_user)
                    self.assertTrue(os.path.exists("/tmp/master_VX-1234_edldata.xml"))
                    #ensure that the file copied over ok.
                    self.assertEqual(checksum(sourcefile),checksum("/tmp/master_VX-1234_edldata.xml"))
