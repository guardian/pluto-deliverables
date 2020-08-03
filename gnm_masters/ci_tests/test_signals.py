import django.test
import os
import logging
from django.core.management import execute_from_command_line
from os import environ, unlink
from mock import MagicMock,patch

logging.basicConfig(level=logging.DEBUG)


class TestSignals(django.test.TestCase):
    def test_handle_external_update_preexisting(self):
        """
        If a master model exists already, the handle_external_update signal handler should request an update of
        the existing model from the VS source
        :return:
        """
        from portal.plugins.gnm_masters.models import VSMaster, MasterModel
        from django.contrib.auth.models import User

        mock_project = MagicMock(target=VSMaster)
        mock_project.update_from_project = MagicMock()
        mock_sender = MagicMock()
        mock_user = MagicMock(target=User)

        target_model = MagicMock(target=MasterModel)
        target_model.update_from_master = MagicMock()

        with patch('portal.plugins.gnm_masters.models.VSMaster', return_value=mock_project) as mock_project_constructor:
            with patch('portal.plugins.gnm_masters.signals.get_admin_user', return_value=mock_user):
                with patch('portal.plugins.gnm_masters.models.MasterModel.objects.get', return_value=target_model) as mock_get:
                    from portal.plugins.gnm_masters.signals import handle_external_update
                    result = handle_external_update(mock_sender, item_id="VX-1234")
                    mock_get.assert_called_once_with(item_id="1234")
                    mock_project_constructor.assert_called_once_with("VX-1234",user=mock_user)
                    target_model.update_from_master.assert_called_once_with(mock_project)

                    self.assertEqual(result, True)

    def test_handle_external_update_create(self):
        """
        If a master model does not already exist, the handle_external_update signal handler should create a new model from
        the existing vidispine data
        :return:
        """
        from portal.plugins.gnm_masters.models import VSMaster, MasterModel
        from django.contrib.auth.models import User

        mock_project = MagicMock(target=VSMaster)
        mock_project.update_from_project = MagicMock()
        mock_sender = MagicMock()
        mock_user = MagicMock(target=User)

        target_model = MagicMock(target=MasterModel)
        target_model.save = MagicMock()

        with patch('portal.plugins.gnm_masters.models.VSMaster', return_value=mock_project) as mock_project_constructor:
            with patch('portal.plugins.gnm_masters.signals.get_admin_user', return_value=mock_user):
                with patch('portal.plugins.gnm_masters.models.MasterModel.objects.get', side_effect=MasterModel.DoesNotExist) as mock_get:
                    with patch('portal.plugins.gnm_masters.models.MasterModel.get_or_create_from_master', return_value=(target_model, True)) as mock_create:
                        from portal.plugins.gnm_masters.signals import handle_external_update
                        result = handle_external_update(mock_sender, item_id="VX-1234")

                        mock_get.assert_called_once_with(item_id="1234")
                        mock_project_constructor.assert_called_once_with("VX-1234",user=mock_user)
                        mock_create.assert_called_once_with(mock_project,user=mock_user)
                        target_model.save.assert_called_once_with()
                        self.assertEqual(result, True)