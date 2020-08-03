# coding: utf-8
from portal.plugins.gnm_misc_utils.test_base import SemiAutomaticCleanupTestBase
from portal.plugins.gnm_vidispine_utils.models import VSModel, Value, Field


class VSTestModel(VSModel):
    '''
    Dummy model implementing the bare minimum to be able to run tests on methods.
    '''
    url = '/{id}'


class UtilModelsTest(SemiAutomaticCleanupTestBase):

    def test_append_to(self):
        list_attribute = 'list_attribute'
        model = VSTestModel('fake_id', self.user, data={list_attribute: []})

        model.append_to(list_attribute, 'VX-1')
        model.append_to(list_attribute, 'VX-2')
        model.append_to(list_attribute, 'VX-3')

        results = getattr(model.md, list_attribute)
        self.assertTrue(isinstance(results, Field))  # Assert the type wasn't accidentally replaced.
        self.assertEqual(3, len(list(results.values())))  # Assert it contains expected amount of values
        for e in results._values:
            self.assertTrue(isinstance(e, Value))  # Assert the correct data type (Value) is used internally.
