
import django.test
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from mock import patch, MagicMock
from xml.etree.cElementTree import Element
import os
from os import unlink
from django.core.management import execute_from_command_line
import logging

logging.basicConfig(level=logging.DEBUG)
os.environ["CI"] = "True"  #simulate a CI environment even if we're not in one, this will stop trying to import portal-specific stuff
#which breaks the tests
import portal.plugins.gnm_commissions.ci_tests.django_test_settings as django_test_settings

os.environ["DJANGO_SETTINGS_MODULE"] = "gnmawsgr.tests.django_test_settings"
if(os.path.exists(django_test_settings.DATABASES['default']['NAME'])):
    unlink(django_test_settings.DATABASES['default']['NAME'])
execute_from_command_line(['manage.py','syncdb',"--noinput"])
execute_from_command_line(['manage.py','migrate',"--noinput"])
execute_from_command_line(['manage.py','loaddata',"users.yaml"])

# Store original __import__
orig_import = __import__

### Patch up imports for Portal-specific stuff that is not accessible in CircleCI
b_mock = MagicMock()
class EmptyClass(object):
    pass
b_mock.ClassView = EmptyClass
c_mock = MagicMock()


def import_mock(name, *args, **kwargs):
    if name == 'portal.generic.baseviews':
        return b_mock
    elif name == 'portal.utils.templatetags.permissionrequired':
        return c_mock

    return orig_import(name, *args, **kwargs)


class TestViews(django.test.TestCase):
    def test_master_trigger_old(self):
        """
        MasterTriggerView should trigger an output for a destination with no New/Update distinction
        :return:
        """
        client = APIClient()
        (u, did_create) = User.objects.get_or_create(username='admin')
        client.force_authenticate(u)

        with patch('__builtin__.__import__', side_effect=import_mock):
            with patch("portal.plugins.gnm_vidispine_utils.vs_helpers.get_metadata_group",return_value=Element('mock')) as mock_vsget:
                with patch("portal.plugins.gnm_masters.mdexporter.item_information", return_value={'originalFilename': ['somefile.mov']}):
                    with patch("portal.plugins.gnm_masters.mdexporter.export_metadata", return_value="/path/to/xmlfile.xml") as mock_export_meta:
                        with patch("portal.plugins.gnm_masters.views.MasterTrigger.update_status") as mock_update_status:
                            result = client.post(reverse("master_trigger", kwargs={'master_id': 'VX-12345', 'target': "facebook"}))
                            self.assertEqual(result.status_code, 200)
                            mock_update_status.assert_called_once_with('Ready to Upload', 'gnm_master_facebook_uploadstatus', 'VX-12345', u)
                            mock_export_meta.assert_called_once_with('VX-12345', '/tmp/facebook', 'somefile.mov', 'inmeta_V5')
                            self.assertDictContainsSubset({
                                'status': 'ok',
                                'detail': 'trigger output to /tmp/facebook',
                                'output_path': '/path/to/xmlfile.xml'
                            }, result.data)

    def test_master_trigger_new(self):
        """
        MasterTriggerView should trigger an output for a destination with a query argument for new/update
        :return:
        """
        client = APIClient()
        (u, did_create) = User.objects.get_or_create(username='admin')
        client.force_authenticate(u)

        with patch('__builtin__.__import__', side_effect=import_mock):
            with patch("portal.plugins.gnm_vidispine_utils.vs_helpers.get_metadata_group",return_value=Element('mock')) as mock_vsget:
                with patch("portal.plugins.gnm_masters.mdexporter.item_information", return_value={'originalFilename': ['somefile.mov']}):
                    with patch("portal.plugins.gnm_masters.mdexporter.export_metadata", return_value="/path/to/xmlfile.xml") as mock_export_meta:
                        with patch("portal.plugins.gnm_masters.views.MasterTrigger.update_status") as mock_update_status:
                            result = client.post(reverse("master_trigger", kwargs={'master_id': 'VX-12345', 'target': "guardian"}) + "?type=New")
                            self.assertEqual(result.status_code, 200)
                            mock_update_status.assert_called_once_with('Ready to Upload', 'gnm_master_gnmwebsite_upload_status', 'VX-12345', u)
                            mock_export_meta.assert_called_once_with('VX-12345', '/tmp/guardian', 'somefile.mov', 'inmeta_V5')
                            self.assertDictContainsSubset({
                                'status': 'ok',
                                'detail': 'trigger output to /tmp/guardian',
                                'output_path': '/path/to/xmlfile.xml'
                            }, result.data)

                            mock_export_meta.reset_mock()
                            mock_update_status.reset_mock()
                            result = client.post(reverse("master_trigger", kwargs={'master_id': 'VX-12345', 'target': "guardian"}) + "?type=Update")
                            self.assertEqual(result.status_code, 200)
                            mock_update_status.assert_called_once_with('Ready to Upload', 'gnm_master_gnmwebsite_upload_status', 'VX-12345', u)
                            mock_export_meta.assert_called_once_with('VX-12345', '/tmp/guardianupdate', 'somefile.mov', 'inmeta_V5')
                            self.assertDictContainsSubset({
                                'status': 'ok',
                                'detail': 'trigger output to /tmp/guardianupdate',
                                'output_path': '/path/to/xmlfile.xml'
                            }, result.data)

    def test_master_trigger_noauth(self):
        """
        MasterTriggerView should only be accessible to a logged in user
        :return:
        """
        client = APIClient()

        with patch('__builtin__.__import__', side_effect=import_mock):
            with patch("portal.plugins.gnm_vidispine_utils.vs_helpers.get_metadata_group",return_value=Element('mock')) as mock_vsget:
                with patch("portal.plugins.gnm_masters.mdexporter.item_information", return_value={'originalFilename': ['somefile.mov']}):
                    with patch("portal.plugins.gnm_masters.mdexporter.export_metadata", return_value="/path/to/xmlfile.xml") as mock_export_meta:
                        with patch("portal.plugins.gnm_masters.views.MasterTrigger.update_status") as mock_update_status:
                            result = client.post(reverse("master_trigger", kwargs={'master_id': 'VX-12345', 'target': "guardian"}) + "?type=New")
                            self.assertEqual(result.status_code, 403)
                            mock_update_status.assert_not_called()
                            mock_export_meta.assert_not_called()