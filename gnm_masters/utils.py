import logging

log = logging.getLogger(__name__)


def get_job_metadata(user_record):
    """
    Returns job metadata for an import. This is called from a function in tasks.py and a method in views.py
    :param user_record: record of the user who is doing the import
    :return: string
    """
    from django.conf import settings

    if not hasattr(settings, "PLUTO_MASTERS_STORAGE"):
        log.warning("PLUTO_MASTERS_STORAGE is not set.  You should set this.")
        return "portal_groups:StringArray%3D{groups}".format(groups=user_record.get_profile().default_ingest_group.name)

    return 'destinationStorageId%3D{storage}&jobmetadata=portal_groups:StringArray%3D{groups}'.format(
        storage=getattr(settings,"PLUTO_MASTERS_STORAGE","VX-1"),
        groups=user_record.get_profile().default_ingest_group.name
    )