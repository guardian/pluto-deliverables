from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.http.request import HttpRequest
from django.contrib.auth.models import User
import hashlib
import hmac
from django.conf import settings
import logging
import re

logger = logging.getLogger(__name__)


class HmacRestAuth(BaseAuthentication):
    xtractor = re.compile(r'HMAC (.*)$')
    checksum_xtractor = re.compile(r'^([\w\d\-]+)=(.*)$')

    @staticmethod
    def extract_signature(header_content: str):
        parts = HmacRestAuth.xtractor.match(header_content)
        if parts is None:
            logger.warning("Authorization header was malformed, expected HMAC got {0}".format(header_content))
            raise AuthenticationFailed
        return parts.group(1)

    @staticmethod
    def extract_checksum(header_content: str):
        parts = HmacRestAuth.checksum_xtractor.match(header_content)
        if parts is None:
            logger.warning("Authorization header was malformed, expected algo=value got {0}".format(header_content))
            raise AuthenticationFailed
        if parts.group(1) != "SHA-384":
            logger.warning("Only SHA-384 is accepted, got {0}".format(parts.group(1)))
            raise AuthenticationFailed
        return parts.group(2)

    def authenticate(self, request: HttpRequest):
        if "HTTP_AUTHORIZATION" not in request.META:
            logger.warning("Incoming request had no Authorization header")
            raise AuthenticationFailed
        else:
            presented_signature = self.extract_signature(request.META.get("HTTP_AUTHORIZATION"))

        if "HTTP_DIGEST" not in request.META:
            logger.warning("Incoming request had no Digest header")
            raise AuthenticationFailed
        else:
            checksum = self.extract_checksum(request.META.get("HTTP_DIGEST"))

        content = request.body

        if request.META.get("HTTP_DATE") is None:
            logger.warning("Incoming request had no Date header")
            raise AuthenticationFailed

        hasher = hashlib.sha384()
        hasher.update(content)
        actual_checksum = hasher.hexdigest()

        if actual_checksum != checksum:
            logger.warning("Content checksum mismatched. Presented {0} but we calculated {1}".format(checksum, actual_checksum))
            raise AuthenticationFailed

        string_to_sign = "{path}\n{http_date}\n{content_type}\n{checksum_string}\n{method}".format(
            path=request.path,
            http_date=request.META.get("HTTP_DATE"),
            content_type=request.content_type,
            checksum_string=checksum,
            method=request.method
        )
        logger.debug("string_to_sign is {0}".format(string_to_sign))

        signature_bytes = hmac.digest(settings.LAUNCH_DETECTOR_SHARED_KEY.encode("UTF-8"), string_to_sign.encode("utf-8"), "sha384")
        signature = signature_bytes.hex()
        logger.debug("calculated signature {0}".format(signature))

        if signature != presented_signature:
            logger.warning("Signature mismatched. Presented {0} but we calculated {1}".format(presented_signature, signature))
            logger.warning("string_to_sign was {0}".format(string_to_sign))
            raise AuthenticationFailed

        return User(
            username="hmac-authenticated",
            first_name="",
            last_name="",
            email="",
            is_staff=False,
            is_active=True,
            is_superuser=False
        ), "hmac"