from django.core.management.base import BaseCommand
import csv
from gnm_deliverables.models import DeliverableAsset
import logging
import hashlib
import hmac
from optparse import OptionParser
from datetime import datetime
import base64
from email.utils import formatdate
import requests
from time import mktime
from urllib.parse import urlparse
from pprint import pprint
import os.path
import requests
import sys


def get_token(uri:str, secret:str, time:datetime) -> (str, str):
    """
    create signing token for archivehunter
    :param uri:
    :param secret:
    :return:
    """
    httpdate = formatdate(timeval=mktime(time.timetuple()),localtime=False,usegmt=True)
    url_parts = urlparse(uri)

    string_to_sign = "{0}\n{1}".format(httpdate, url_parts.path)
    print("string_to_sign: " + string_to_sign)
    hm = hmac.new(secret.encode("UTF-8"), string_to_sign.encode("UTF-8"),hashlib.sha256)
    return "HMAC {0}".format(base64.b64encode(hm.digest()).decode("UTF-8")), httpdate


class NotFoundResponse(Exception):
    pass


class ForbiddenResponse(Exception):
    pass


class ServerErrorResponse(Exception):
    pass


def authenticated_request(uri:str, secret:str, verify=True, override_time:datetime=None) -> dict:
    if override_time is not None:
        timestamp = override_time
    else:
        timestamp = datetime.now()

    authtoken, httpdate = get_token(uri, secret, timestamp)

    headers = {
        'X-Gu-Tools-HMAC-Date': httpdate,
        'X-Gu-Tools-HMAC-Token': authtoken,
    }

    response = requests.get(uri, headers=headers, verify=verify)

    if response.status_code==200:
        return response.json()
    elif response.status_code==404:
        raise NotFoundResponse
    elif response.status_code==403 or response.status_code==401:
        logger.error("Server returned forbidden. Server said: {}".format(response.text))
        raise ForbiddenResponse
    elif response.status_code==500:
        logger.error("Server error looking up. Server said: {}".format(response.text))
        raise ServerErrorResponse
    else:
        raise Exception("Unexpected server response: {} {}".format(response.status_code, response.text))


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    management command to validate that items apparently in archive are actually there
    """
    help = 'Verify that the registered archive ID for deliverables is accurate'

    def add_arguments(self, parser):
        parser.add_argument("--output", name="output", type=str, default="report.csv", help="location to output a CSV report")
        parser.add_argument("--server", name="server", type=str, help="base URL to Archive Hunter")
        parser.add_argument("--secret", name="secret", type=str, help="shared secret for authentication")
        parser.add_argument("--insecure-no-verify", name="noverify", type=bool, default=False, help="don't verify SSL certs. Not recommended.")
    queryset = DeliverableAsset.objects.exclude(archive_item_id__isnull=True, archive_item_id__exact="")

    def handle(self, *args, **options):
        output_file_path = options["output"]

        if not options["server"]:
            print("You must specify --server on the commandline")
            sys.exit(1)
        if not options["secret"]:
            print("You must specify --secret on the commandline")
            sys.exit(1)

        total_count = DeliverableAsset.objects.all().count()
        archived_count = self.queryset.count()

        with open(output_file_path, "w") as f:
            writer = csv.writer(f, dialect=csv.excel)
            writer.writerow(["Asset ID","Bundle ID", "Filename","Bundle name","Archive Id","Found"])

            logger.info("Out of {} items registered, {} are in the archive".format(total_count, archived_count))
            for asset in self.queryset:
                try:
                    url = os.path.join(options["server"],"api/entry",asset.archive_item_id)
                    logger.debug("url is {0}".format(url))
                    authenticated_request(url, options["secret"], options["noverify"])
                    logger.info("Found archived entry for {}".format(asset.filename))
                except NotFoundResponse:
                    logger.info("No archived entry found for {}".format(asset.filename))
                    writer.writerow([asset.id, asset.deliverable_id, asset.filename, asset.deliverable.name, asset.archive_item_id, False])
