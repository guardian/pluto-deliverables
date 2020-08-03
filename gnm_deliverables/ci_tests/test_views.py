import django.test
import rest_framework.test
from mock import MagicMock, patch
from django.core.urlresolvers import reverse_lazy
from django.contrib.auth.models import User
import logging
import json
import os
from django.core.management import execute_from_command_line

logging.basicConfig(level=logging.DEBUG)
os.environ["CI"] = "True"  #simulate a CI environment even if we're not in one, this will stop trying to import portal-specific stuff
#which breaks the tests
import portal.plugins.gnm_projects.ci_tests.django_test_settings as django_test_settings

# Store original __import__
orig_import = __import__

### Patch up imports for Portal-specific stuff that is not accessible in CircleCI
baseviews_mock = MagicMock()
class EmptyClass(object):
    pass
baseviews_mock.ClassView = EmptyClass
c_mock = MagicMock()

def import_mock(name, *args, **kwargs):
    if name == 'portal.generic.baseviews':
        return baseviews_mock
    elif name == 'portal.pluginbase.core':
        return c_mock
    elif name == 'portal.generic.plugin_interfaces':
        return c_mock
    elif name == 'portal.utils.templatetags.permissionrequired':
        return c_mock
    return orig_import(name, *args, **kwargs)

os.environ["DJANGO_SETTINGS_MODULE"] = "portal.plugins.gnm_deliverables.tests.django_test_settings"
if(os.path.exists(django_test_settings.DATABASES['default']['NAME'])):
    os.unlink(django_test_settings.DATABASES['default']['NAME'])
execute_from_command_line(['manage.py','syncdb',"--noinput"])
execute_from_command_line(['manage.py','migrate',"--noinput"])
execute_from_command_line(['manage.py','loaddata',"users.yaml"])
execute_from_command_line(['manage.py','loaddata',"commissions.yaml"])
execute_from_command_line(['manage.py','loaddata',"projects.yaml"])
execute_from_command_line(['manage.py','loaddata',"deliverables.yaml"])


class TestDeliverablesSearchForWorkingGroupAPIView(rest_framework.test.APITestCase):
    fixtures = [
        'users',
        'commissions',
        'projects',
        'deliverables'
    ]

    def test_wgonly(self):
        """
        DeliverablesSearchForWorkingGroupAPIView should return all deliverables associated with the given working group
        :return:
        """
        import json
        u = User.objects.get(pk=2)
        client = rest_framework.test.APIClient()
        client.force_authenticate(u)

        result = client.get(reverse_lazy("deliverables_search_workinggroup", kwargs = {'working_group': "84c34edb-5a5f-4f5a-b300-d6ee613efbf4"}))
        data = json.loads(result.content)

        self.assertEqual(result.status_code, 200)
        self.assertEqual(data["iTotalRecords"], 2)
        returned_data = data["aaData"]

        titles = [entry[5] for entry in returned_data]
        self.assertEqual(titles, ["Second Bundle","Third Bundle"])
        project_ids = [entry[6] for entry in returned_data]
        self.assertEqual(project_ids, ["VX-28","VX-29"])

        result = client.get(reverse_lazy("deliverables_search_workinggroup", kwargs = {'working_group': "0b003a58-dcf7-452c-8e21-6c5fd804f3ce"}))
        data = json.loads(result.content)

        self.assertEqual(result.status_code, 200)
        self.assertEqual(data["iTotalRecords"], 1)
        returned_data = data["aaData"]

        titles = [entry[5] for entry in returned_data]
        self.assertEqual(titles, ["First Bundle"])
        project_ids = [entry[6] for entry in returned_data]
        self.assertEqual(project_ids, ["VX-27"])

    def test_wginvalid(self):
        """
        DeliverablesSearchForWorkingGroupAPIView should return zero deliverables if there is no matching working group
        :return:
        """
        import json
        u = User.objects.get(pk=2)
        client = rest_framework.test.APIClient()
        client.force_authenticate(u)

        result = client.get(reverse_lazy("deliverables_search_workinggroup", kwargs = {'working_group': "2283ed40-b3a6-46ec-8b5b-78d46c2dfc2b"}))
        data = json.loads(result.content)

        self.assertEqual(result.status_code, 200)
        self.assertEqual(data["iTotalRecords"], 0)
        returned_data = data["aaData"]

        self.assertEqual(len(returned_data), 0)

    def test_wg_user(self):
        """
        DeliverablesSearchForWorkingGroupAPIView should return all deliverables associated with the given working group
        :return:
        """
        import json
        from portal.plugins.gnm_projects.models import ProjectModel
        u = User.objects.get(pk=2)
        client = rest_framework.test.APIClient()
        client.force_authenticate(u)

        #for some reason this value is not properly coming through from the fixture
        test_record = ProjectModel.objects.get(pk=28)
        test_record.gnm_project_username = [u]
        test_record.save()

        result = client.get(reverse_lazy("deliverables_search_workinggroup", kwargs = {'working_group': "84c34edb-5a5f-4f5a-b300-d6ee613efbf4"}) + "?mine=1")
        data = json.loads(result.content)
        print(data)

        self.assertEqual(result.status_code, 200)
        self.assertEqual(data["iTotalRecords"], 1)
        returned_data = data["aaData"]

        titles = [entry[5] for entry in returned_data]
        self.assertEqual(titles, ["Second Bundle"])
        project_ids = [entry[6] for entry in returned_data]
        self.assertEqual(project_ids, ["VX-28"])