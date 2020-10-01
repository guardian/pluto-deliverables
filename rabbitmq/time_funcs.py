import datetime
import pytz
from django.conf import settings


def get_current_time() -> datetime.datetime:
    """
    returns the current time in a timezone-aware datetime object.
    uses settings.TIME_ZONE if present or UTC if not
    :return:
    """
    if hasattr(settings,"TIME_ZONE"):
        current_tz = pytz.timezone(settings.TIME_ZONE)
    else:
        current_tz = pytz.UTC

    return datetime.datetime.now(current_tz)