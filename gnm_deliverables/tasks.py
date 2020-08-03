from __future__ import unicode_literals

import logging
from celery.decorators import periodic_task
from celery.schedules import crontab
from django.conf import settings
from django.contrib.auth.models import User

from .choices import DELIVERABLE_ASSET_STATUS_INGESTED
from .models import DeliverableAsset

logger = logging.getLogger(__name__)


def init_raven():
    try:
        from raven import Client as RavenClient
        from django.conf import settings
        raven_client = RavenClient(settings.RAVEN_CONFIG['dsn'])
        return raven_client
    except StandardError as e:
        logger.error("Unable to initialise Sentry: {0}".format(e))
    return None


@periodic_task(run_every=crontab())
def remove_stale_files():
    """
    Remove files from disk for deliverable assets after they are ingested.

    IMPORTANT: Make sure write permissions exists for the directories created for deliverables for the user running
    celery.

    :return:
    """
    raven_client = init_raven()
    try:
        assets = DeliverableAsset.objects.filter(file_removed_dt__isnull=True)
        logger.info('Trying to removing files for {count} deliverables'.format(count=assets.count()))
        for asset in assets:
            user = User.objects.get(username=settings.VIDISPINE_USERNAME)
            status = asset.status(user)
            if status != DELIVERABLE_ASSET_STATUS_INGESTED:
                logger.debug('Not removing file for asset "{asset}": File not ingested yet'.format(asset=asset))
    except Exception as e:
        if raven_client is not None:
            raven_client.captureException()
        raise e
