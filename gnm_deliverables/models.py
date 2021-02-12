# coding: utf-8

import errno
import logging
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.db.models import Q
from django.utils.functional import cached_property
from django.utils.timezone import now
from gnmvidispine.vs_item import VSItem, VSException, VSNotFound
from gnmvidispine.vs_job import VSJob
from .choices import DELIVERABLE_ASSET_STATUS_INGEST_FAILED, \
    DELIVERABLE_ASSET_TYPES_DICT, UPLOAD_STATUS, PRODUCTION_OFFICE, PRIMARY_TONE, \
    PUBLICATION_STATUS, DELIVERABLE_ASSET_STATUS_TRANSCODING
from .choices import DELIVERABLE_ASSET_STATUS_NOT_INGESTED, DELIVERABLE_ASSET_STATUSES, DELIVERABLE_ASSET_STATUS_TRANSCODED
from .choices import DELIVERABLE_ASSET_TYPE_CHOICES, DELIVERABLE_STATUS_ALL_FILES_INGESTED, \
    DELIVERABLE_STATUS_FILES_TO_INGEST, DELIVERABLE_ASSET_TYPE_OTHER_SUBTITLE, \
    DELIVERABLE_ASSET_TYPE_OTHER_TRAILER, \
    DELIVERABLE_ASSET_TYPE_OTHER_MISCELLANEOUS
from .exceptions import ImportFailedError, NoShapeError
from .files import get_path_for_deliverable, find_files_for_deliverable, create_folder, \
    get_local_path_for_deliverable, create_folder_for_deliverable
from .templatetags.deliverable_tags import sizeof_fmt
from .transcodepreset import TranscodePresetFinder
logger = logging.getLogger(__name__)


def seconds_to_timestamp(seconds):
    return time.strftime('%H:%M:%S', time.gmtime(float(seconds)))


transcode_preset_finder = TranscodePresetFinder()


class Deliverable(models.Model):
    project_id = models.CharField(null=True, blank=True, max_length=61)
    commission_id = models.BigIntegerField(null=False, blank=False, db_index=True)
    pluto_core_project_id = models.BigIntegerField(null=False, blank=False, db_index=True, unique=True)
    name = models.CharField(null=False, blank=False, unique=True, max_length=255)
    created = models.DateTimeField(null=False, blank=False, auto_now_add=True)

    def sync_assets_from_file_system(self):
        """
        performs a scan of the drop-folder associated with this deliverable. If a file is found that does not correspond
        to a DeliverableAsset record then create a record for it, if there is a corresponding record then update the ctime/
        mtime/atime.
        Also, if any asset records have NOT been imported (i.e. their type and item_id is null) and their corresponding
        files have been removed then delete those records.
        :return: a dictionary with two keys, a count of "added" records and a count of "removed" records.
        """
        assets_on_fs = []
        added_count = 0
        removed_count = 0

        for f in find_files_for_deliverable(self.name):
            asset, created = DeliverableAsset.objects.get_or_create(
                filename=f.path,
                deliverable=self,
                size=f.size,
                modified_dt=f.modified_dt,
                defaults=dict(
                    access_dt=f.access_dt,
                    changed_dt=f.changed_dt,
                    absolute_path=f.absolute_path
                )
            )
            assets_on_fs.append(asset)
            if created:
                logger.info('Asset created: %s' % asset)
                added_count += 1
            else:
                logger.info('Asset already existed: %s' % asset)
                # Update defaults
                asset.access_dt = f.access_dt
                asset.changed_dt = f.changed_dt
                asset.absolute_path = f.absolute_path
                asset.save()

        # Remove assets rows that are not found on the FS and does not have an item tied to it
        assets_to_delete = self.assets.filter(
            type__isnull=True,
            online_item_id__isnull=True
        ).exclude(
            id__in=[a.id for a in assets_on_fs]
        )
        delete_count = assets_to_delete.count()
        if delete_count > 0:
            assets_to_delete.delete()
            removed_count += 1
            logger.info('Deleted %s asset rows' % delete_count)
        return {"added": added_count, "removed": removed_count}

    @cached_property
    def path(self):
        return get_path_for_deliverable(self.name)

    @cached_property
    def local_path(self):
        return get_local_path_for_deliverable(self.name)

    @cached_property
    def local_open_uri(self):
        local_path = self.local_path.rstrip('/') + '/'
        return 'pluto:openfolder:%s' % urllib.parse.quote(local_path)

    def status(self):
        if self.assets.filter(ingest_complete_dt__isnull=True).exists():
            return DELIVERABLE_STATUS_FILES_TO_INGEST
        else:
            return DELIVERABLE_STATUS_ALL_FILES_INGESTED

    def asset_type(self, type):
        assets = self.assets.filter(type=type)
        return None if assets.count() <= 0 else assets[0]

    def create_folder(self):
        return create_folder(self.path)

    def create_folder_for_deliverable(self):
        return create_folder_for_deliverable(self.name)

    def create_asset_from_vs_item(self, item_id, user):
        """
        tries to "adopt" the given existing vidispine item onto this deliverable bundle.
        if the item is already associated with this deliverable bundle then it is returned without re-import.
        can raise NoShapeError if either the item has no original shape, or VSNotFound if the item does not exist.
        can also raise other VSException from gnmvidispine if server communication fails.
        :param item_id: item id to adopt
        :param user: name of the user carrying out the operation, it will be done as this user in VS
        :return: a tuple of (DeliverableAsset, Boolean) where the boolean value indicates whether a new DeliverableAsset
        was created or not
        """
        created = False
        try:
            asset = DeliverableAsset.objects.get(online_item_id=item_id, deliverable=self)
            logger.info(
                'Asset for item "{item_id}" already existed: {asset}'.format(item_id=item_id,
                                                                             asset=asset))
        except DeliverableAsset.DoesNotExist:
            asset = DeliverableAsset(
                online_item_id=item_id,
                deliverable=self
            )
            item = asset.item(user)
            try:
                shape = item.get_shape("master")
            except VSNotFound:
                ##we can tidy the re-raise up later
                raise NoShapeError('No original shape attached to item')

            asset.filename = item.get("originalFilename", allowArray=False)
            asset.absolute_path = item.get("originalUri", allowArray=False)

            files = [x for x in shape.files()]
            if len(files) == 0:
                raise NoShapeError("Original shape had no files on it")
            asset.size = files[0].size
            mtime = None  ##FIXME: sort this out
            asset.ingest_complete_dt = now()
            asset.created_from_existing_item = True
            asset.save()
            created = True

            logger.info(
                'Asset for item "{item_id}" created: {asset}'.format(item_id=item_id, asset=asset))
        return asset, created

    @classmethod
    def for_project(cls, project_id):
        return Deliverable.objects.filter(project_id=project_id)

    @classmethod
    def sync_project(cls, project_id):
        deliverables = cls.for_project(project_id)
        for deliverable in deliverables:
            deliverable.sync_assets_from_file_system()
        return deliverables

    def __str__(self):
        return self.__unicode__()

    def __unicode__(self):
        return '{name}'.format(name=self.name)

    class Meta:
        pass


class DeliverableAsset(models.Model):
    type = models.PositiveIntegerField(null=True, blank=True,
                                       choices=DELIVERABLE_ASSET_TYPE_CHOICES)

    # Stat info
    filename = models.TextField(null=True, blank=True)
    absolute_path = models.TextField(null=True, blank=True)
    size = models.BigIntegerField(null=True, blank=True)
    access_dt = models.DateTimeField(null=True, blank=True)
    modified_dt = models.DateTimeField(null=True, blank=True)
    changed_dt = models.DateTimeField(null=True, blank=True)

    # Fields set on ingest
    job_id = models.TextField(null=True, blank=True)
    online_item_id = models.TextField(null=True, blank=True)
    nearline_item_id = models.TextField(null=True, blank=True)
    archive_item_id = models.TextField(null=True, blank=True)

    ingest_complete_dt = models.DateTimeField(null=True, blank=True)
    file_removed_dt = models.DateTimeField(null=True, blank=True)

    duration_seconds = models.FloatField(null=True, blank=True)
    version = models.IntegerField(null=True, blank=True)
    # Fields set by atom responder
    atom_id = models.UUIDField(null=True)

    # Lifecycle
    status = models.IntegerField(null=False,
                                 choices=DELIVERABLE_ASSET_STATUSES,
                                 default=DELIVERABLE_ASSET_STATUS_NOT_INGESTED)

    created_from_existing_item = models.BooleanField(default=False)

    deliverable = models.ForeignKey(Deliverable, related_name='assets', on_delete=models.PROTECT)

    # Syndication metadata
    gnm_website_master = models.ForeignKey('GNMWebsite', on_delete=models.SET_NULL, null=True)
    youtube_master = models.ForeignKey('Youtube', on_delete=models.SET_NULL, null=True)
    DailyMotion_master = models.ForeignKey('DailyMotion', on_delete=models.SET_NULL, null=True)
    mainstream_master = models.ForeignKey('Mainstream', on_delete=models.SET_NULL, null=True)

    def __init__(self, *args, **kwargs):
        super(DeliverableAsset, self).__init__(*args, **kwargs)
        self.__item = None
        self.__job = None

    def update_metadata(self, user):
        """
        updates the metadata on all storage layers
        :param user:
        :return:
        """
        raise Exception("update_metadata is not implemented yet")
        # set_item_metadata(user, self.item_id, metadata_document_from_dict(dict(title=self.get_name()), md_group='Deliverable'))

    def get_name(self):
        # naming convention
        return '{type} for {name}'.format(type=self.type_string, name=self.deliverable.name)

    def create_placeholder(self, user, commit=True):
        """
        requests Vidispine to create a placeholder item for this deliverable, if it does not have an ID on it.
        if the deliverable does already have an item id, this is a no-op.
        this is automatically called from start_file_import, so you don't need to call it directly.
        :param user: (string) user to run the request as
        :param commit: if True, save the deliverable to the database immediately (default true)
        :return: None
        """
        if not isinstance(user, str):
            raise TypeError("create_placeholder user must be a string, got a {0}".format(user.__class__.__name__))

        if self.online_item_id is None:
            new_item = VSItem(url=settings.VIDISPINE_URL,
                              user=settings.VIDISPINE_USER,
                              passwd=settings.VIDISPINE_PASSWORD,
                              run_as=user)

            builder = new_item.get_metadata_builder()
            builder.addMeta({
                "title": self.get_name()
            })
            builder.addGroup("Asset",{
                "gnm_category": "Deliverable",
                "original_filename": self.absolute_path,
                "gnm_owner": user,
                "gnm_containing_projects": str(self.deliverable.pluto_core_project_id),
                "gnm_file_created": self.modified_dt
            })
            builder.addGroup("Deliverable", {
                "gnm_deliverable_bundle": str(self.deliverable.pluto_core_project_id),
                "gnm_deliverable_id": str(self.id)
            })
            new_item.createPlaceholder(builder.as_xml().decode("utf8"))

            if commit:
                self.save()
            return new_item
            #we don't store stuff in collections any more
            #add_to_collection(user, self.deliverable.project_id, self.item_id)

    def start_file_import(self, user, commit=True):
        """
        tells VS to start importing the file.
         If no item currently exists, then a placeholder is created and the media imported to that.
         If an item does currently exist, then the media is added as a new version.
        This can raise any subclass of gnmvidispine.VSException
        :param user: username to run the operation as
        :param commit: whether to save the model before returning
        :return:
        """
        if self.created_from_existing_item:
            return
        if self.online_item_id is None:
            current_item = self.create_placeholder(user, commit=False)
        else:
            current_item = self.item(user=user)

        #run_as should be taken care of by the VSItem base class, initated from self.item
        import_job = current_item.import_to_shape(uri="file://" + self.absolute_path.replace(" ","%20"),
                                                  priority="MEDIUM",
                                                  essence=True,
                                                  thumbnails=False,
                                                  jobMetadata={
                                                      "import_source": "pluto-deliverables",
                                                      "project_id": str(self.deliverable.pluto_core_project_id),
                                                      "asset_id": str(self.id)
                                                  })
        self.job_id = import_job.name
        if commit:
            self.save()

    def create_proxy(self, priority='MEDIUM'):
        """
        tells VS to start proxying the file.  This is done seperately to the ingest portion, so that we can use
        Vidispine's understanding of the file format in order to determine which is the appropriate transcoding
        to use.
        Can raise either a VSException or a vidispine_api.HttpError if the operation fails.
        This is normally called from the callback endpoint, so we have no user present suitable for "run-as"
        :return:
        """
        item_info = self.item(None)     # caller should catch exceptions from this
        if item_info is None:
            raise ValueError("Item is not imported")

        mime_type = item_info.get("mimeType")
        if mime_type is None:
            logger.error("{0} for deliverable asset {1} in {2}: Could not determine MIME type for transcode".format(item_info.name, self.id, self.deliverable.id))
            return None

        preset_name = transcode_preset_finder.match(mime_type)
        if preset_name is None:
            logger.error("{0} for deliverable asset {1} in {2}: Did not recognise MIME type {3}".format(item_info.name, self.id, self.deliverable.id, mime_type))
            raise ValueError("Did not recognise MIME type of item")

        try:
            # raises VSNotFound if the shape does not exist, which is what we expect.
            item_info.get_shape(preset_name)
            logger.info("Item {0} already has a shape {1}, not transcoding it".format(item_info.name, preset_name))
            self.status = DELIVERABLE_ASSET_STATUS_TRANSCODED
            self.save()
        except VSNotFound:
            pass

        logger.info("Requesting transcode to {0} of {1}".format(item_info.name, preset_name))
        job_id = item_info.transcode(preset_name, priority, wait=False, create_thumbnails=True,
                                     job_metadata={
                                        "import_source": "pluto-deliverables",
                                        "project_id": str(self.deliverable.pluto_core_project_id),
                                        "asset_id": str(self.id)
                                    })

        self.job_id = job_id
        self.status = DELIVERABLE_ASSET_STATUS_TRANSCODING
        self.save()
        return job_id

    def has_ongoing_job(self, user):
        """
        returns a boolean indicating whether this deliverable has a job ongoing or not
        :param user:
        :return:
        """
        try:
            current_job = self.job(user)
            if current_job is None:
                return None
            else:
                return not current_job.finished()

        except VSNotFound:
            # no job => no ongoing job!
            return None

    @cached_property
    def type_string(self):
        return DELIVERABLE_ASSET_TYPES_DICT.get(self.type)

    @cached_property
    def size_string(self):
        return sizeof_fmt(self.size)

    def type_allows_many(self):
        return self.type == DELIVERABLE_ASSET_TYPE_OTHER_SUBTITLE \
               or self.type == DELIVERABLE_ASSET_TYPE_OTHER_TRAILER \
               or self.type == DELIVERABLE_ASSET_TYPE_OTHER_MISCELLANEOUS

    def _set_cached_item(self, newvalue):
        """
        method for testing, to manually set the cached item. you should not call this directly, but rely on it to be setr
        by calling item()
        :param newvalue:
        :return:
        """
        self.__item = newvalue

    def item(self, user):
        """
        returns a gnmvidispine VSItem object representing the vidispine item associated with this deliverable.
        the first time it is called (this happens internally) the data is lifted from the VS server and thereafter
        it is cached
        the item_id must be set for this to work.  None is returned if the item id is not set; VSNotFound is raised
        if the item does not exist, or another VSException is raised if server communication fails
        :param user: username to run the metadata get as
        :return: the VSItem, possibly from in-memory cache
        """
        if self.__item is not None:
            return self.__item
        if self.online_item_id is not None:
            self.__item = VSItem(url=settings.VIDISPINE_URL, user=settings.VIDISPINE_USER,
                                 passwd=settings.VIDISPINE_PASSWORD, run_as=user)
            self.__item.populate(self.online_item_id)
            return self.__item
        return None

    def job(self, user):
        """
        returns a gnmvidispine VSJob that represents the import job assocaited with this deliverable, or None if there was
        none set.
        can raise a VSNotFound if the job does not exist or another VSException if server communication fails
        :param user:
        :return:
        """
        if self.__job is not None:
            return self.__job
        if self.job_id is not None:
            self.__job = VSJob(url=settings.VIDISPINE_URL, user=settings.VIDISPINE_USER,
                               passwd=settings.VIDISPINE_PASSWORD, run_as=user)
            return self.__job.populate(self.job_id)
        return None

    def purge(self, user=None):
        if self.online_item_id is not None:
            try:
                exists_in_other_deliverable = DeliverableAsset.objects.filter(
                    Q(online_item_id=self.online_item_id) & ~Q(id=self.id)
                ).exists()
                if not self.created_from_existing_item and not exists_in_other_deliverable:
                    self.item(user).delete()

            except VSException:
                logger.exception(
                    'Failed to delete item id "{item_id}" for deliverable asset "{id}"'.format(
                        item_id=self.online_item_id,
                        id=self.id
                    ))
            super(DeliverableAsset, self).delete()

    def remove_file(self):
        """
        Try to remove the original source file from disk, once it's been ingested. Sets file_removed_dt and saves the model.
        :return: True if the file was removed, False if not.
        """
        try:
            os.remove(str(self.absolute_path))
            logger.info('Removed file for asset "{asset}": "{path}"'.format(asset=self,
                                                                            path=self.absolute_path))
            self.file_removed_dt = now()
            self.save()
            return True
        except OSError as e:
            # this _should_ get picked up by the periodic task remove_stale_files
            if e.errno == errno.ENOENT:
                # No such file
                if self.file_removed_dt is None:
                    self.file_removed_dt = now()
                    self.save()
                return False
            else:
                logger.exception('Failed to remove "{path}"'.format(path=self.absolute_path))
                return False

    def __str__(self):
        return '{name}'.format(name=self.filename)


class GNMWebsite(models.Model):
    media_atom_id = models.UUIDField(null=True, blank=True)
    upload_status = models.TextField(null=True, blank=True,
                                     choices=UPLOAD_STATUS, db_index=True)
    production_office = models.TextField(null=True, blank=True, choices=PRODUCTION_OFFICE,
                                         db_index=True)
    tags = ArrayField(models.CharField(null=True, max_length=255), null=True, blank=True,
                      db_index=True)
    publication_date = models.DateTimeField(null=True, blank=True)
    website_title = models.TextField(null=True, blank=True, db_index=True)
    website_description = models.TextField(null=True, blank=True)
    primary_tone = models.TextField(null=True, blank=True, choices=PRIMARY_TONE, db_index=True)
    publication_status = models.TextField(null=True, blank=True, choices=PUBLICATION_STATUS)
    etag = models.DateTimeField(null=False, blank=False, auto_now_add=True)


class Mainstream(models.Model):
    mainstream_title = models.TextField(null=False, blank=False)
    mainstream_description = models.TextField(null=True, blank=True)
    mainstream_tags = ArrayField(models.CharField(null=False, max_length=255), null=True, blank=True)
    mainstream_rules_contains_adult_content = models.BooleanField()
    upload_status = models.TextField(null=True, blank=True, choices=UPLOAD_STATUS, db_index=True)
    publication_date = models.DateTimeField(null=True, blank=True)
    etag = models.DateTimeField(null=False, blank=False, auto_now_add=True)


class Youtube(models.Model):
    youtube_id = models.TextField(null=False, blank=False, db_index=True)
    youtube_title = models.TextField(null=False, blank=False)
    youtube_description = models.TextField(null=True, blank=True)
    youtube_tags = ArrayField(models.CharField(null=True, max_length=255), null=True, blank=True)
    youtube_categories = ArrayField(models.BigIntegerField(null=False), null=True, blank=True)
    youtube_channels = ArrayField(models.CharField(null=True, max_length=255), null=True, blank=True)
    publication_date = models.DateTimeField(null=True, blank=True)
    etag = models.DateTimeField(null=False, blank=False, auto_now_add=True)

    def __str__(self):
        return '{title}'.format(title=self.youtube_title)


class DailyMotion(models.Model):
    daily_motion_url = models.TextField(null=True, blank=True)
    daily_motion_title = models.TextField(null=False, blank=False)
    daily_motion_description = models.TextField(null=True, blank=True)
    daily_motion_tags = ArrayField(models.CharField(null=True, max_length=255), null=True, blank=True)
    daily_motion_category = models.TextField(default="news")
    publication_date = models.DateTimeField(null=True, blank=True)
    upload_status = models.TextField(null=True, blank=True, choices=UPLOAD_STATUS, db_index=True)
    daily_motion_no_mobile_access = models.BooleanField()
    daily_motion_contains_adult_content = models.BooleanField()
    etag = models.DateTimeField(null=False, blank=False, auto_now_add=True)


class LogEntry(models.Model):
    timestamp = models.DateTimeField(null=False, blank=False)
    related_gnm_website = models.ForeignKey(GNMWebsite, on_delete=models.CASCADE, null=True,
                                            db_index=True)
    related_youtube = models.ForeignKey(Youtube, on_delete=models.CASCADE, null=True,
                                        db_index=True)
    related_daily_motion = models.ForeignKey(DailyMotion, on_delete=models.CASCADE, null=True,
                                             db_index=True)
    related_mainstream = models.ForeignKey(Mainstream, on_delete=models.CASCADE, null=True,
                                           db_index=True)
    sender = models.TextField(null=False, blank=False, db_index=True)
    log_line = models.TextField(null=False, blank=False)
