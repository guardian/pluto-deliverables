import os
import errno
import stat
from collections import namedtuple

from django.utils.timezone import datetime
import logging

logger = logging.getLogger(__name__)

FileInfo = namedtuple('FileInfo', 'absolute_path path size access_dt modified_dt changed_dt')


def strpbrk(haystack, char_list):
    try:
        pos = next(i for i, x in enumerate(haystack) if x in char_list)
        return haystack[pos:]
    except:
        return None


def is_valid_dir_name(name):
    return strpbrk(name, '\\/?%*:|\"<>')


def get_path_for_deliverable(name):
    from django.conf import settings
    return os.path.join(getattr(settings, 'GNM_DELIVERABLES_SAN_ROOT', '/tmp'), name)


def get_local_path_for_deliverable(name):
    from django.conf import settings
    return os.path.join(getattr(settings, 'GNM_DELIVERABLES_SAN_ROOT_LOCAL', '/tmp'), name)


def ts_to_dt(timestamp, millis=False):
    """
    converts a timestamp value to a datetime value
    :param timestamp:
    :param millis:
    :return:
    """
    try:
        ts = float(timestamp)
        if millis:
            ts /= 1000.0
        return datetime.utcfromtimestamp(ts)
    except TypeError:
        return None


def find_files_for_deliverable(name):
    """
    generator that yields a FileInfo named tuple for each file that exists in the dropfolder corresponding to the
    given deliverable.
    :param name: deliverable bundle name, used for making the path to scan
    :return: yields fileInfo objects, possibly zero if there is nothing in the dropfolder.
    """
    deliverable_path = get_path_for_deliverable(name)
    print("find_files_for_deliverable: scanning {0}".format(deliverable_path))
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
        if e.errno == errno.EEXIST:
            return path, False
        raise e


def create_folder_for_deliverable(name):
    return create_folder(get_path_for_deliverable(name))
