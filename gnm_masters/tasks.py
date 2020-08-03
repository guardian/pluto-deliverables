import os
import traceback
from django.core.exceptions import ValidationError
from django.utils.html import mark_safe
from portal.plugins.gnm_misc_utils.helpers import parse_xml
from portal.plugins.gnm_masters.models import VSMaster, SigniantImport, PortalNleXml
from portal.plugins.gnm_vidispine_utils import constants as const
from portal.plugins.gnm_vidispine_utils import vs_calls
from portal.plugins.gnm_vidispine_utils.md_utils import E, tag
from celery.decorators import periodic_task
from celery.schedules import crontab
from datetime import datetime, timedelta
from lxml import etree as ET
import celery
import logging
import urllib
import re
import shutil
log = logging.getLogger(__name__)

@celery.task
def update_pacdata(path, master_id, user):
    from portal.plugins.nle.utility import get_storage_mapping
    from portal.vidispine.iitem import ItemHelper
    from portal.vidispine.istorage import StorageHelper
    from portal.plugins.gnm_misc_utils.helpers import inform_sentry_exception

    try:
        with open(path, 'r') as f:
            xml = f.read()

        xml_tree = parse_xml(xml)

        _ith = ItemHelper(runas=user)
        storage_mapping = get_storage_mapping(platform='mac')

        _sth = StorageHelper(runas=user)

        # If xmeml node is missing this is not the correct type of file and we should set the
        # status to invalid
        assert xml_tree.xpath('//xmeml')

        from portal.plugins.nle.views import get_items_from_fcp7_xml, replace_items_with_tombstones

        item_mapping = get_items_from_fcp7_xml(xml, storage_mapping, _sth)

        for item in item_mapping:
            if 'item' in item:
                try:
                    _ith.createItemRelation(item['item'], master_id, keywords={'type': 'portal_rendered_media_source'})
                except TypeError:
                    log.info('Updating PAC References requires Portal 2.0 or above')
                except:
                    inform_sentry_exception("Trying to update PAC reference for item {0}".format(item['item']))
                    log.info('Something went wrong with updating reference for item ' + item['item'])

        xml = ET.tostring(xml_tree)
        xml = replace_items_with_tombstones(xml, item_mapping)

        master = VSMaster(id=master_id, user=user)
        master.set_portal_nle_xml(xml)
        master.create_pacdata_db_cache()
    except:
        inform_sentry_exception("Parsing PACDATA for master {0} failed".format(master_id))
        log.error('Parsing PACDATA for master ' + master_id + ' failed.')
        log.error(traceback.format_exc())

        md = E.MetadataDocument(
            E.timespan(
                E.field(
                    E.name(const.GNM_MASTERS_GENERIC_PACDATA_STAUS),
                    E.value(const.PACMAN_INVALID),
                ), end='+INF', start='-INF'
            )
        )
        vs_calls.put('item/{id}/metadata'.format(id=master_id), ET.tostring(md), user)

    finally:
        os.remove(path)


@periodic_task(run_every=crontab())
def scan_importables():
    from django.conf import settings
    from portal.plugins.gnm_masters.utils import get_job_metadata
    NOW = datetime.now().date()
    LIMIT = timedelta(days=2) # stop trying after this amout of time
    for sgn in SigniantImport.objects.all():
        if sgn.started:
            r = vs_calls.get('job/%s' % sgn.job_id, sgn.user)
            if r.status_code < 200 or r.status_code >= 300:
                log.error('Failed to contact Vidispine')
                return
            r = parse_xml(r.content)
            status = r.find(tag('status')).text
            if status == 'FINISHED':
                log.info('Import of remote master finished. Unlocking master %s' % sgn.item_id)
                master = VSMaster(id=sgn.item_id, user=sgn.user)
                master.set('gnm_master_upload_lock', '')
                master.vs_save()
                sgn.delete()
                # TODO delete remote master file?
            elif status in ('FINISHED_WARNING', 'FAILED_TOTAL', 'ABORTED'):
                sgn.started = None
                sgn.save()
        elif sgn.created + LIMIT < NOW:
            log.info('Failed to import remote master for item %s within time limit. Will not try again, unlocking master' % sgn.item_id)
            sgn.delete()
            master = VSMaster(id=sgn.item_id, user=sgn.user)
            master.set('gnm_master_upload_lock', '')
            master.vs_save()
        elif sgn.valid_filename:
            try:
                files = find_remote_master_vs(sgn)
                if not files:
                    if not getattr(settings, 'MASTER_REMOTE_UPLOAD_PATH', None):
                        continue
                    try:
                        file_path = find_remote_master(sgn.filename)
                        if not file_path:
                            continue
                    except Exception as x:
                        log.exception(x)
                        _inform_sentry('Failed to find remote master file')
                        continue
                    file_uri = ('file://%s' % urllib.quote(file_path))
                    log.info('Starting import: %s' % file_uri)
                    file_uri = urllib.quote(file_uri, safe='')
                    jobmetadata = get_job_metadata(sgn.user)
                    r = vs_calls.post('item/%s/shape/essence?uri=%s&jobmetadata=%s&priority=HIGH' % (sgn.item_id, file_uri, jobmetadata), '', sgn.user)
                    if r.status_code < 200 or r.status_code >= 300:
                        log.error('Failed to import file: %s' % r.status_code)
                        continue
                    r = parse_xml(r.content)
                    sgn.started = datetime.now()
                    sgn.job_id = r.find(tag('jobId')).text
                    sgn.save()
                    continue
                elif len(files) != 1:
                    _inform_sentry('Found more than one remote master file matching name %s' % sgn.filename)
                    continue
                file_id = files[0]
            except Exception as x:
                log.error(x)
                _inform_sentry('Failed to find remote master file name %s' % sgn.filename)
                continue
            log.info('Starting import: %s' % file_id)
            jobmetadata = get_job_metadata(sgn.user)
            r = vs_calls.post('item/%s/shape/essence?fileId=%s&jobmetadata=%s&priority=HIGH' % (sgn.item_id, file_id, jobmetadata), '', sgn.user)
            if r.status_code < 200 or r.status_code >= 300:
                _inform_sentry('Failed to import file id %s: %s' % (file_id, r.status_code))
                if r.status_code == 400:
                    log.info('Unlocking master: %s' % sgn.item_id)
                    master = VSMaster(id=sgn.item_id, user=sgn.user)
                    master.set('gnm_master_upload_lock', '')
                    master.vs_save()
                    sgn.delete()
                continue
            r = parse_xml(r.content)
            sgn.started = datetime.now()
            sgn.job_id = r.find(tag('jobId')).text
            sgn.save()


def find_remote_master(filename):
    from django.conf import settings
    path = getattr(settings, 'MASTER_REMOTE_UPLOAD_PATH', None)
    if not path:
        log.error('MASTER_REMOTE_UPLOAD_PATH not found in settings')
        return None
    files = []
    log.info('Looking for %s' % filename)
    for f in os.listdir(path):
        log.info('Considering %s' % f)
        if not f.startswith(filename):
            continue
        head, tail = os.path.splitext(f)
        head = head.strip()
        if head == filename:
            return os.path.join(path, f)
        elif len(filename) < len(head) and head[len(filename)].isalpha(): # fuzzy match
            continue
        files.append(f)
    if len(files) != 1:
        if files:
            _inform_sentry('Found more than one matching remote master file: %s' % files)
        return None
    return os.path.join(path, files[0])

def find_remote_master_vs(signiant_import):
    from django.conf import settings
    from portal.plugins.gnm_masters.exceptions import NotAMasterError
    log.info('Looking for %s' % signiant_import.filename)
    r = vs_calls.get('storage/file;includeItem=true?recursive=true&wildcard=true&path=*%s*' % urllib.quote(signiant_import.filename), signiant_import.user)
    if r.status_code < 200 or r.status_code >= 300:
        raise ValidationError('Failed to contact Vidispine')
    r = parse_xml(r.content)
    files = []
    for file in r.findall(tag('file')):
        if getattr(settings, 'MASTER_REMOTE_UPLOAD_PATH', None):
            try:
                uri = file.find(tag('uri')).text
                if settings.MASTER_REMOTE_UPLOAD_PATH not in uri:
                    continue
            except:
                pass
        file_id = file.find(tag('id')).text
        path = file.find(tag('path')).text
        storage_id = file.find(tag('storage')).text
        f = os.path.split(path)[1] # remove leading path components
        if not f.startswith(signiant_import.filename):
            continue
        head, tail = os.path.splitext(f)
        head = head.strip()
        if head == signiant_import.filename:
            files.append(file_id)
            continue
        elif len(signiant_import.filename) < len(head) and head[len(signiant_import.filename)].isalpha(): # fuzzy match
            continue
        try:
            item_id = file.find(tag('item')).find(tag('id')).text
        except:
            files.append(file_id)
            continue
        if item_id == signiant_import.item_id:
            # TODO delete signiant_import
            raise ValidationError(mark_safe('File name "%s" already exists, and the <a href="/vs/storage/%s/">file</a> is associated with <a href="/master/%s/">this master</a>' % (signiant_import.filename, storage_id, item_id)))
        try:
            r = VSMaster(id=item_id, user=signiant_import.user)
            raise ValidationError(mark_safe('File name "%s" already exists, and the <a href="/vs/storage/%s/">file</a> is associated with another <a href="/master/%s/">master</a>' % (signiant_import.filename, storage_id, item_id)))
        except NotAMasterError:
            raise ValidationError(mark_safe('File name "%s" already exists, and the <a href="/vs/storage/%s/">file</a> is associated with another <a href="/vs/item/%s/">asset</a>' % (signiant_import.filename, storage_id, item_id)))
    return files

def _inform_sentry(message):
    from django.conf import settings
    if hasattr(settings, 'RAVEN_CONFIG'):
        from raven import Client
        client = Client(dsn=settings.RAVEN_CONFIG['dsn'])
        client.captureException(extra={'message': message})
    log.error(message)


def reserve_filename(master, filename):
        filename = os.path.splitext(filename)[0].strip() # discard the file extension
        if len(filename) < 7:
            raise ValidationError('File name is too short')
        elif '/' in filename or '\\' in filename:
            raise ValidationError('File name must not contain /')
        elif not re.match(r'^\d\d\d\d\d\d.+$', filename):
            raise ValidationError(mark_safe('File name must match YYMMDD<i>fileName</i>.'))
        sgn = validate_filename(master, filename)
        if not sgn.valid_filename:
            sgn.valid_filename = True
            sgn.save()
        return sgn


def validate_filename(master, filename):
    from portal.plugins.gnm_masters.models import VSMaster, SigniantImport
    from portal.plugins.gnm_masters.exceptions import NotAMasterError
    try:
        sgn = SigniantImport.objects.get(item_id=master.id)
        if sgn.filename != filename:
            if sgn.started:
                raise ValidationError(mark_safe('Another file with a different name "%s" is being <a href="/vs/job/%s/">imported</a> to this master' % (sgn.filename, sgn.job_id)))
            sgn.delete()
    except SigniantImport.DoesNotExist:
        pass

    sgn, created = SigniantImport.objects.get_or_create(filename=filename, defaults={'item_id': master.id, 'user': master.user})
    if not sgn.item_id == master.id:
        raise ValidationError(mark_safe('File name "%s" already exists, and the file is being imported to another <a href="/vs/item/%s/">master</a>' % (filename, sgn.item_id)))

    if find_remote_master_vs(sgn):
        # TODO change this?
        raise ValidationError(mark_safe('File name "%s" already exists' % filename))
    return sgn
