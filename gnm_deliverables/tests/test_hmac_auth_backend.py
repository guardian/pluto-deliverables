from django.test import TestCase
from django.http.request import HttpRequest
from mock import MagicMock
from rest_framework.exceptions import AuthenticationFailed
from gnm_deliverables.hmac_auth_backend import HmacRestAuth


class TestHMACAuthBackend(TestCase):
    def test_auth(self):
        """
        the signer should calculate the same values that the Launch Detector implementation does
        :return:
        """
        request = MagicMock(target=HttpRequest)
        request.body = """{"key":"value"}""".encode("utf-8")
        request.META = {
            "HTTP_AUTHORIZATION": "HMAC 497b5ad0dd0df550546ba81ae1c5634d2e4fba2885255568641c33358beb5bd1ea0dbd5d1209be2216fef433226ba6d9",
            "HTTP_DIGEST": "SHA-384=b491c9142540686efa07e25e090562ae3f7c1cac3cb00d730f1aaf251e3e703d19a3ca88de1d7cd5375d14c76346a3c2",
            "HTTP_DATE": "Thu, 02 Jan 2020 03:04:05 GMT"
        }
        request.content_type = "application/json"
        request.path = "/some/path/to/something"
        request.method = "POST"

        to_test = HmacRestAuth()
        to_test.authenticate(request)
