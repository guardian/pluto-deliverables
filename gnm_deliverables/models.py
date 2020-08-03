# coding: utf-8

import errno
import logging
import os
import urllib.request, urllib.parse, urllib.error
from dateutil import parser
from django.db import models
from django.db.models import Q
from django.utils.functional import cached_property
from django.utils.timezone import now
from django.conf import settings
import time
from .choices import DELIVERABLE_ASSET_STATUS_INGEST_FAILED, \
    DELIVERABLE_ASSET_STATUSES_DICT
from .choices import DELIVERABLE_ASSET_STATUS_NOT_INGESTED, \
    DELIVERABLE_ASSET_STATUS_INGESTING, DELIVERABLE_ASSET_STATUS_INGESTED, DELIVERABLE_ASSET_TYPES_DICT
from .choices import DELIVERABLE_ASSET_TYPE_CHOICES, DELIVERABLE_STATUS_ALL_FILES_INGESTED, \
    DELIVERABLE_STATUS_FILES_TO_INGEST, DELIVERABLE_ASSET_TYPE_OTHER_SUBTITLE, DELIVERABLE_ASSET_TYPE_OTHER_TRAILER, \
    DELIVERABLE_ASSET_TYPE_OTHER_MISCELLANEOUS
from .exceptions import ImportFailedError, NoShapeError
from .files import ts_to_dt, get_path_for_deliverable, find_files_for_deliverable, create_folder, get_local_path_for_deliverable
from .templatetags.deliverable_tags import sizeof_fmt
from gnmvidispine.vs_item import VSItem, VSException, VSNotFound
from gnmvidispine.vs_job import VSJob

logger = logging.getLogger(__name__)


def seconds_to_timestamp(seconds):
    return time.strftime('%H:%M:%S', time.gmtime(float(seconds)))


class Deliverable(models.Model):
    project_id = models.CharField(null=False, blank=False, max_length=61)
    name = models.CharField(null=False, blank=False, unique=True, max_length=255)
    created = models.DateTimeField(null=False, blank=False, auto_now_add=True)

    def sync_assets_from_file_system(self):
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
                added_count+=1
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
            item_id__isnull=True
        ).exclude(
            id__in=[a.id for a in assets_on_fs]
        )
        delete_count = assets_to_delete.count()
        if delete_count > 0:
            assets_to_delete.delete()
            removed_count+=1
            logger.info('Deleted %s asset rows' % delete_count)
        return {"added":added_count,"removed":removed_count}

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

    def create_asset_from_vs_item(self, item_id, user):
        created = False
        try:
            asset = DeliverableAsset.objects.get(item_id=item_id, deliverable=self)
            logger.info('Asset for item "{item_id}" already existed: {asset}'.format(item_id=item_id, asset=asset))
        except DeliverableAsset.DoesNotExist:
            asset = DeliverableAsset(
                item_id=item_id,
                deliverable=self
            )
            item = asset.item(user)
            try:
                shape = item.get_shape("master")
            except VSNotFound:
                ##we can tidy the re-raise up later
                raise NoShapeError('No original shape attached to item')

            asset.filename = item.get("originalFilename",allowArray=False)
            asset.absolute_path = item.get("originalUri", allowArray=False)

            files = [x for x in shape.files()]
            if len(files) == 0:
                raise NoShapeError("Original shape had no files on it")
            asset.size = files[0].size
            mtime = None ##FIXME: sort this out
            asset.ingest_complete_dt = now()
            asset.created_from_existing_item = True
            asset.save()
            created = True

            # data = get_fields_in_inf(item, ['originalFilename', 'originalUri'])
            # asset.filename = safeget(data, 'originalFilename', 'value', 0, 'value')
            # asset.absolute_path = safeget(data, 'originalUri', 'value', 0, 'value')
            # component = safeget(shape, 'containerComponent')
            # if component is None:
            #     component = safeget(shape, 'binaryComponent')
            #     if not component:
            #         raise NoShapeError('No original shape attached to item')
            #     component = component[0]
            # container_md_fields = safeget(component, 'file', 0, 'metadata', 'field')
            # asset.size = safeget(component, 'file', 0, 'size')
            # container_data = get_fields(container_md_fields, ['mtime'], 'key')
            # mtime = safeget(container_data, 'mtime', 'value')
            # if mtime is not None:
            #     asset.modified_dt = ts_to_dt(mtime, millis=True)
            #     asset.changed_dt = asset.modified_dt
            #     asset.access_dt = asset.modified_dt
            # asset.ingest_complete_dt = now()
            # asset.created_from_existing_item = True
            # asset.save()
            # created = True
            logger.info('Asset for item "{item_id}" created: {asset}'.format(item_id=item_id, asset=asset))
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
    type = models.PositiveIntegerField(null=True, blank=True, choices=DELIVERABLE_ASSET_TYPE_CHOICES)

    # Stat info
    filename = models.TextField(null=True, blank=True)
    absolute_path = models.TextField(null=True, blank=True)
    size = models.BigIntegerField(null=True, blank=True)
    access_dt = models.DateTimeField(null=True, blank=True)
    modified_dt = models.DateTimeField(null=True, blank=True)
    changed_dt = models.DateTimeField(null=True, blank=True)

    # Fields set on ingest
    job_id = models.TextField(null=True, blank=True)
    item_id = models.TextField(null=True, blank=True)

    ingest_complete_dt = models.DateTimeField(null=True, blank=True)
    file_removed_dt = models.DateTimeField(null=True, blank=True)

    created_from_existing_item = models.BooleanField(default=False)

    deliverable = models.ForeignKey(Deliverable, related_name='assets', on_delete=models.PROTECT)

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
        #set_item_metadata(user, self.item_id, metadata_document_from_dict(dict(title=self.get_name()), md_group='Deliverable'))

    def get_name(self):
        # naming convention
        return '{type} for {name}'.format(type=self.type_string, name=self.deliverable.name)

    def create_placeholder(self, user, commit=True):
        """
        requests Vidispine to create a placeholder item for this deliverable, if it does not have an ID on it.
        if the deliverable does already have an item id, this is a no-op
        :param user: user to run the request as
        :param commit: if True, save the deliverable to the database immediately (default true)
        :return: None
        """
        if self.item_id is None:
            # self.item_id = create_placeholder_item(user, metadata_document_from_dict(dict(
            #     title=self.get_name(),
            #     gnm_asset_category='Deliverable',
            #     gnm_asset_status='Ready for Editing',
            #     gnm_type='Deliverable',
            #     gnm_deliverable_parent_project=self.deliverable.project_id,
            #     gnm_deliverable_parent_deliverables=str(self.deliverable.id),
            #     gnm_storage_rule_deep_archive='storage_rule_deep_archive',
            #     ExternalArchiveRequest=dict(
            #         gnm_external_archive_external_archive_request='Requested Archive',
            #         # TODO configurable media expiry field
            #     )
            # ), md_group='Deliverable'))
            new_item = VSItem(url=settings.VIDISPINE_URL,user=settings.VIDISPINE_USER,passwd=settings.VIDISPINE_PASSWORD, run_as=user)
            new_item.createPlaceholder(dict(
                 title=self.get_name(),
                 gnm_asset_category='Deliverable',
                 gnm_asset_status='Ready for Editing',
                 gnm_type='Deliverable',
                 gnm_deliverable_parent_project=self.deliverable.project_id,
                 gnm_deliverable_parent_deliverables=str(self.deliverable.id),
            ))
            if commit:
                self.save()
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
        if self.item_id is None:
            raise ImportFailedError('No item id could be found')
        #self.job_id = create_import_job(user, self.absolute_path, self.item_id)
        current_item = self.item(user=user)
        if current_item is None:
            current_item = self.create_placeholder(user, commit=False)

        #FIXME: shape_tag needs to be properly determined
        import_job = current_item.import_to_shape(uri=self.absolute_path,shape_tag=["lowres"],priority="MEDIUM")
        self.job_id = import_job.name
        if commit:
            self.save()

    def has_ongoing_job(self, user):
        """
        returns a boolean indicating whether this deliverable has a job ongoing or not
        :param user:
        :return:
        """
        try:
            return not self.job(user).finished()
        except VSNotFound:
            #no job => no ongoing job!
            return None
        # job = self.job(user)
        # return job is not None and job.get('status', None) not in [
        #     'FINISHED',
        #     'FINISHED_WARNING',
        #     'FAILED_TOTAL',
        #     'ABORTED'
        # ]

    def status(self, user):
        if self.ingest_complete_dt is not None:
            return DELIVERABLE_ASSET_STATUS_INGESTED
        job = self.job(user)
        if job is not None:
            status = job.status()
            finished = job.get_metadata("finished")
            if finished:
                self.ingest_complete_dt = parser.parse(finished)
                self.save()
            if status in ['FINISHED', 'FINISHED_WARNING']:
                self.remove_file()
                return DELIVERABLE_ASSET_STATUS_INGESTED
            elif status in ['FAILED_TOTAL', 'ABORTED']:
                return DELIVERABLE_ASSET_STATUS_INGEST_FAILED
            else:
                return DELIVERABLE_ASSET_STATUS_INGESTING
        return DELIVERABLE_ASSET_STATUS_NOT_INGESTED

    def status_string(self, user):
        status = self.status(user)
        return DELIVERABLE_ASSET_STATUSES_DICT.get(status)

    def version(self, user):
        """
        asks VS to get the version of the item associated with this deliverable.
        can raise a VSException, ususally VSNotFound
        :param user:  user to run the operation as
        :return:
        """
        return self.item(user).get_shape("original").essence_version
        # item = self.item(user)
        # shape = get_shape_with_tag(item, 'original')
        # if shape is None:
        #     return None
        # return safeget(shape, 'essenceVersion')

    def duration(self, user):
        duration_string = self.item(user).get("durationSeconds",allowArray=False)
        return seconds_to_timestamp(duration_string) if duration_string is not None else None
        # item = self.item(user)
        # fields = get_fields_in_inf(item, ['durationSeconds'])
        # duration = safeget(fields, 'durationSeconds', 'value', 0, 'value')
        # return seconds_to_timestamp(duration) if duration is not None else None

    @cached_property
    def type_string(self):
        print("in type_string, raw type is {0}".format(self.type))
        return DELIVERABLE_ASSET_TYPES_DICT.get(self.type)

    @cached_property
    def size_string(self):
        return sizeof_fmt(self.size)

    # @cached_property
    # def changed_string(self):
    #     return date.strftime('%d/%m/%Y %I:%M %p') if self.changed_dt else ''
        
        
    def type_allows_many(self):
        return self.type == DELIVERABLE_ASSET_TYPE_OTHER_SUBTITLE \
            or self.type == DELIVERABLE_ASSET_TYPE_OTHER_TRAILER \
            or self.type == DELIVERABLE_ASSET_TYPE_OTHER_MISCELLANEOUS

    def item(self, user):
        if self.__item is not None:
            return self.__item
        if self.item_id is not None:
            try:
                #self.__item = get_item(item_id=self.item_id, user=user)
                self.__item = VSItem(url=settings.VIDISPINE_URL,user=settings.VIDISPINE_USER,passwd=settings.VIDISPINE_PASSWORD,run_as=user)
                self.__item.populate(self.item_id)
                return self.__item
            except VSException:
                logger.exception(
                    'Failed to get item with id "{item_id}" for deliverable asset "{id}"'.format(
                        item_id=self.item_id,
                        id=self.id
                    ))
        return None

    def job(self, user):
        if self.__job is not None:
            return self.__job
        if self.job_id is not None:
            try:
                #self.__job = get_job(job_id=self.job_id, user=user)
                self.__job = VSJob(url=settings.VIDISPINE_URL, user=settings.VIDISPINE_USER, passwd=settings.VIDISPINE_PASSWORD, run_as=user)
                return self.__job.populate(self.job_id)
            except VSException:
                logger.exception(
                    'Failed to get job with id "{job_id}" for deliverable asset "{id}"'.format(
                        job_id=self.job_id,
                        id=self.id
                    ))
        return None

    def purge(self, user=None):
        if self.item_id is not None:
            try:
                exists_in_other_deliverable = DeliverableAsset.objects.filter(
                    Q(item_id=self.item_id) & ~Q(id=self.id)
                ).exists()
                if not self.created_from_existing_item and not exists_in_other_deliverable:
                    self.item(user).delete()

            except VSException:
                logger.exception(
                    'Failed to delete item id "{item_id}" for deliverable asset "{id}"'.format(
                        item_id=self.item_id,
                        id=self.id
                    ))
            super(DeliverableAsset, self).delete()

    def remove_file(self):
        try:
            os.remove(str(self.absolute_path))
            logger.info('Removed file for asset "{asset}": "{path}"'.format(asset=self, path=self.absolute_path))
            self.file_removed_dt = now()
            self.save()
            return True
        except OSError as e:
            logger.exception('Failed to remove "{path}"'.format(path=self.absolute_path))
            #this _should_ get picked up by the periodic task remove_stale_files
            if e.errno == errno.ENOENT:
                # No such file
                self.file_removed_dt = now()
                self.save()
                return True

    def __str__(self):
        return '{name}'.format(name=self.filename)

