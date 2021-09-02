import os
import errno
import stat
from collections import namedtuple
import typing
import pytz
import re
from django.utils.timezone import datetime
import logging

logger = logging.getLogger(__name__)

FileInfo = namedtuple('FileInfo', 'absolute_path path size access_dt modified_dt changed_dt')

DANGEROUS_CHARS = '\\/?%*;:!|\"<>'
FILEPATH_SANITISER = re.compile("[{0}]".format(DANGEROUS_CHARS))


def sanitise_dir_name(name: str) -> str:
    """
    sanitise the given path part
    :param name:
    :return:
    """
    return FILEPATH_SANITISER.sub("", name)


def get_path_for_deliverable(name: str)->str:
    """
    returns the expected server-side path of the dropfolder for assets for the given bundle name.

    :param name: bundle name
    :return: the expected path for the asset folder.
    """
    from django.conf import settings
    return os.path.join(getattr(settings, 'GNM_DELIVERABLES_SAN_ROOT', '/tmp'), sanitise_dir_name(name))


def get_local_path_for_deliverable(name: str) -> str:
    """
    returns the expected client-side path of the dropfolder for assets for the given bundle name.

    :param name: bundle name
    :return: the expected path for the asset folder.
    """
    from django.conf import settings
    return os.path.join(getattr(settings, 'GNM_DELIVERABLES_SAN_ROOT_LOCAL', '/tmp'), sanitise_dir_name(name))


def ts_to_dt(timestamp: typing.Union[float, int], millis=False) -> datetime:
    """
    Converts a timestamp value to a datetime value.
    The configured timezone from the settings is applied to the resulting DateTime.  If no timezone is configured,
    then we default to UTC and emit a warning
    :param timestamp: epoch timestamp value to convert. Expect a TypeError to be raised if this is not a float or int.
    :param millis: if True, then the `timestamp` value is in milliseconds. If False (the default) then it's in seconds
    :return: the timezone-aware datetime
    """
    from django.conf import settings

    ts = float(timestamp)
    if millis:
        ts /= 1000.0
    naive_dt = datetime.utcfromtimestamp(ts)
    tz = pytz.timezone("UTC")
    aware_utc_dt = tz.localize(naive_dt)
    if hasattr(settings, "TIME_ZONE"):
        server_tz = pytz.timezone(settings.TIME_ZONE)
        return aware_utc_dt.astimezone(server_tz)
    else:
        logger.warning("TIME_ZONE is not configured in the settings, defaulting to UTC")
        return aware_utc_dt


def find_files_for_deliverable(name):
    """
    generator that yields a FileInfo named tuple for each file that exists in the dropfolder corresponding to the
    given deliverable.
    :param name: deliverable bundle name, used for making the path to scan
    :return: yields fileInfo objects, possibly zero if there is nothing in the dropfolder.
    """
    deliverable_path = get_path_for_deliverable(name)
    logger.info("find_files_for_deliverable: scanning {0}".format(deliverable_path))
    for root, dirs, files in os.walk(deliverable_path):
        for f in files:
            if f[0] == '.':
                continue
            absolute_path = os.path.join(root, f)
            stat_result = os.stat(absolute_path)
            yield FileInfo(
                absolute_path=absolute_path,
                path=absolute_path.replace(deliverable_path, '').lstrip(os.path.sep),  # path relative deliverable path
                size=stat_result.st_size,
                access_dt=ts_to_dt(stat_result.st_atime),
                modified_dt=ts_to_dt(stat_result.st_mtime),
                changed_dt=ts_to_dt(stat_result.st_ctime)
            )


def create_folder(path, permission=None):
    if permission is None:
        from django.conf import settings
        permission=getattr(settings, 'GNM_DELIVERABLES_FOLDER_PERMISSION', stat.S_IRWXU | stat.S_IRWXG)
    try:
        os.makedirs(path)
        os.chmod(path, permission)
        return path, True
    except OSError as e:
        logger.error("Got {0}, checking for {1}".format(e.errno, errno.EEXIST))
        if e.errno == errno.EEXIST:
            return path, False
        raise e


def create_folder_for_deliverable(name):
    return create_folder(get_path_for_deliverable(name))
