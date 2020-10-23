from django.test import TestCase
import requests
from mock import MagicMock, patch
from datetime import datetime

class TestCommandValidateArchive(TestCase):
    fixtures = [
        "bundles",
        "assets",
    ]

    def test_authenticated_request(self):
        """
        authenticated_request should add hmac date and token fields then return the server data as a dict,
        assuming that the request is successfull
        :return:
        """
        mocked_response = requests.Response()
        mocked_response.status_code = 200
        mocked_response.json = MagicMock(return_value={"some":"key","someother":"value"})
        mocked_time = datetime(2020,1,2,3,4,5,6)

        with patch("requests.get", return_value=mocked_response) as mocked_get:
            from gnm_deliverables.management.commands.validate_archive import authenticated_request

            result = authenticated_request("https://some-server/some/path","rubbish-secret",True, override_time=mocked_time)

            mocked_get.assert_called_once_with("https://some-server/some/path",
                                               headers={'X-Gu-Tools-HMAC-Date': 'Thu, 02 Jan 2020 03:04:05 GMT',
                                                        'X-Gu-Tools-HMAC-Token': 'HMAC nSOMG4VIO4BiLmqoI+EfHfiEfIOMei82We2IifC+S2k='
                                                        },
                                               verify=True)
            self.assertEqual(result, {"some":"key","someother":"value"})

    def test_authenticated_request_404(self):
        """
        authenticated_request should raise the right exception if the status is 404
        :return:
        """
        mocked_response = requests.Response()
        mocked_response.status_code = 404
        mocked_response.json = MagicMock(return_value={"some":"key","someother":"value"})
        mocked_time = datetime(2020,1,2,3,4,5,6)

        with patch("requests.get", return_value=mocked_response) as mocked_get:
            from gnm_deliverables.management.commands.validate_archive import authenticated_request, NotFoundResponse

            with self.assertRaises(NotFoundResponse):
                result = authenticated_request("https://some-server/some/path","rubbish-secret",True, override_time=mocked_time)

                mocked_get.assert_called_once_with("https://some-server/some/path",
                                                   headers={'X-Gu-Tools-HMAC-Date': 'Thu, 02 Jan 2020 03:04:05 GMT',
                                                            'X-Gu-Tools-HMAC-Token': 'HMAC nSOMG4VIO4BiLmqoI+EfHfiEfIOMei82We2IifC+S2k='
                                                            },
                                                   verify=True)

    def test_authenticated_request_500(self):
        """
        authenticated_request should raise the right exception if the status is 500
        :return:
        """
        mocked_response = requests.Response()
        mocked_response.status_code = 500
        mocked_response.json = MagicMock(return_value={"some":"key","someother":"value"})
        mocked_time = datetime(2020,1,2,3,4,5,6)

        with patch("requests.get", return_value=mocked_response) as mocked_get:
            from gnm_deliverables.management.commands.validate_archive import authenticated_request, ServerErrorResponse

            with self.assertRaises(ServerErrorResponse):
                result = authenticated_request("https://some-server/some/path","rubbish-secret",True, override_time=mocked_time)

                mocked_get.assert_called_once_with("https://some-server/some/path",
                                                   headers={'X-Gu-Tools-HMAC-Date': 'Thu, 02 Jan 2020 03:04:05 GMT',
                                                            'X-Gu-Tools-HMAC-Token': 'HMAC nSOMG4VIO4BiLmqoI+EfHfiEfIOMei82We2IifC+S2k='
                                                            },
                                                   verify=True)

    def test_authenticated_request_401(self):
        """
        authenticated_request should raise the right exception if the status is 401
        :return:
        """
        mocked_response = requests.Response()
        mocked_response.status_code = 401
        mocked_response.json = MagicMock(return_value={"some":"key","someother":"value"})
        mocked_time = datetime(2020,1,2,3,4,5,6)

        with patch("requests.get", return_value=mocked_response) as mocked_get:
            from gnm_deliverables.management.commands.validate_archive import authenticated_request, ForbiddenResponse

            with self.assertRaises(ForbiddenResponse):
                result = authenticated_request("https://some-server/some/path","rubbish-secret",True, override_time=mocked_time)

                mocked_get.assert_called_once_with("https://some-server/some/path",
                                                   headers={'X-Gu-Tools-HMAC-Date': 'Thu, 02 Jan 2020 03:04:05 GMT',
                                                            'X-Gu-Tools-HMAC-Token': 'HMAC nSOMG4VIO4BiLmqoI+EfHfiEfIOMei82We2IifC+S2k='
                                                            },
                                                   verify=True)