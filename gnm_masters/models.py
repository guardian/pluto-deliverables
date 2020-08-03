# coding: utf-8
import traceback
from portal.plugins.gnm_assets.models import VSAsset
from portal.plugins.gnm_misc_utils.helpers import parse_xml
from portal.plugins.gnm_vidispine_utils import constants as const
from portal.plugins.gnm_vidispine_utils import vs_calls, md_utils
from portal.plugins.gnm_vidispine_utils.models import VSModel
from portal.plugins.gnm_masters.exceptions import NotAMasterError
from portal.plugins.gnm_vidispine_errors.exceptions import VSHttp403, VSException
from portal.plugins.gnm_projects.exceptions import NotAProjectError
from portal.plugins.gnm_vidispine_errors.error_handling import is_error, raise_error
from portal.plugins.gnm_metadataform.models import Image
from portal.plugins.gnm_vidispine_utils import vs_helpers
from portal.plugins.gnm_smartsearches import search
from portal.plugins.gnm_tags.models import GnmContributor
from portal.plugins.gnm_pacman.models import Timeline, PACMANClip
from portal.plugins.gnm_vidispine_utils.md_utils import tag
from portal.plugins.gnm_misc_utils.helpers import inform_sentry
from django.conf import settings
from django.core.cache import cache
from django.db import IntegrityError, models as django_models
from django.contrib.auth.models import User
from lxml import etree as ET
import logging
import json
import subprocess
import dateutil
import datetime
import shutil
import os
import pytz

logger = logging.getLogger(__name__)


def _inform_sentry(message, extra):
    from django.conf import settings
    if hasattr(settings, 'RAVEN_CONFIG'):
        from raven import Client
        client = Client(dsn=settings.RAVEN_CONFIG['dsn'])
        client.captureMessage(message, extra=extra)
    logger.error(message)


class VSMaster(VSModel):
    url = 'item/{id}/metadata'
    get_params = ';group=-xmp_root;field=-portal_nle_xml'
    pacdata_url = 'item/{id}/metadata;group=-xmp_root'
    get_proxy_url = 'item/{id}?content=shape&methodType=AUTO&tag=lowres'
    acl_url = 'item/{id}/merged-access/'

    # field_references = { }
    ignore_on_update = [
        const.GNM_COMMISSION_TITLE,
        const.GNM_PROJECT_HEADLINE,
        const.GNM_COMMISSION_WORKINGGROUP,
    ]

    @staticmethod
    def vs_create(data, user, references=None, parent_commission=None, parent_project=None):
        data[const.GNM_TYPE] = const.GNM_MASTER_TYPE
        data[const.GNM_ASSET_CREATEDBY] = str(user.pk)
        # Create the metadata document this way because it's lazy - and lazy is good.
        master = VSMaster('PLACEHOLDER', user, data)
        master._update_raw_metadata()
        if references is not None:
            master._add_raw_references(references)
        md_clean = master._clean_md_raw(create=True)
        resp = vs_calls.post('import/placeholder?container=1', ET.tostring(md_clean), user.username)
        if is_error(resp.status_code):
            logger.error("Vidispine returned {0} for import/placeholder?container=1 and returned {1}".format(resp.status_code, resp.text))
            logger.error("metadata document was {0}".format(ET.tostring(md_clean)))
            inform_sentry("Vidispine error when creating master".format(resp.status_code),extra_ctx={
                'vs_status_code': resp.status_code,
                'vs_response_message': resp.text,
                'pluto_request_body': ET.tostring(md_clean)
            })
            # Raise appropriate exception
            raise_error(resp)
        itemdoc = parse_xml(resp.content)
        if parent_commission is None:
            parent_commission = parent_project.get_parent_commission()
        master.id = itemdoc.attrib.get('id')
        m, created = MasterModel.get_or_create_from_master(master, user, parent_commission, parent_project)
        if not created:
            logger.error('MasterModel not created')
        new_master = VSMaster(id=master.id, user=user)
        new_master.set_field_group()
        return new_master

    @classmethod
    def _perform_search(cls, criteria=None, user=None, sorting=None, first=None, number=None):
        '''
        Search for masters matching the given search criteria

        Keyword arguments:
            cls -- This class
            criteria -- Search criteria xml. Should be encapsulated within <AND></AND>.
            user -- User running this search. If called from code that in turn has been called form a django view leaving this argument as "None" will result in running the search as the logged in user.

        Returns:
            List of masters matching the search criteria
        '''
        user = vs_helpers.runas_user(user)

        # Only find commissions
        search_criteria = cls.search_criteria(criteria, sorting)

        return search(search_criteria.encode('utf-8'), user, first, number)

    @staticmethod
    def search_criteria(criteria=None, sorting=None):
        if criteria is None:
            criteria = ''
        if sorting is None:
            sorting = ''

        return u'<AND><{type}>{item_type}</{type}>{additional_criteria}</AND>{sorting}'.format(
            type=const.GNM_TYPE,
            item_type=const.GNM_MASTER_TYPE,
            additional_criteria=criteria,
            sorting=sorting,
        )

    def vs_delete(self):
        resp = vs_calls.delete('item/{id}'.format(id=self.id))
        if is_error(resp.status_code):
            # Raise appropriate exception
            raise_error(resp)

    def validate_type(self):
        if self.get(const.GNM_TYPE) != const.GNM_MASTER_TYPE:
            raise NotAMasterError('This is not a Master, but some other type of Item.')

    def get_parent_project(self):
        from portal.plugins.gnm_projects.models import VSProject

        if hasattr(self, 'parent_project'):
            return self.parent_project

        if hasattr(self.md, const.VS_COLLECTION):
            collections = self.get(const.VS_COLLECTION)
            if not md_utils.is_iterable_sequence(collections):
                # Turn into list for convenience
                collections = [collections]
            for id in collections:
                try:
                    self.parent_project = VSProject(id, self.user)
                    return self.parent_project
                except VSHttp403:
                    logger.error("Permission denied to access potential project {0}".format(id))
                except (NotAProjectError, VSHttp403):
                    pass
            logger.warning("Could not find a matching project from Vidispine collection ids {0}".format(collections))
        else:
            logger.warning("Master {0} had no {1} record in Vidispine metadata".format(self.id, const.VS_COLLECTION))
        return None

    def get_parent_projects(self):
        # a master only belongs to one project (right?)
        # this method matches get_parent_project() in VSAsset
        p = self.get_parent_project()
        if p is None:
            logger.error('Master %s does not belong to any project' % self.id)
            return []
        return [p]

    def get_parent_projects_subscribers(self):
        # this method matches get_parent_projects_subscribers() in VSAsset
        return self.get_parent_project().subscribers()

    def subscribers(self):
        return self.get_parent_projects_subscribers()

    def get_parent_title(self):
        return self.get(const.GNM_PROJECT_HEADLINE, '')

    @staticmethod
    def vspath_to_clientpath(path):
        """
        Converts a Vidispine sent path to a client-compatible one
        :param path: vidispine url path (string)
        :return: client-compatible url path (string)
        """
        import re
        return re.sub(r'/API','/VSAPI',path)

    def holdingimage_16x9_url(self):
        holdingimagejson = self.get('gnm_master_generic_holdingimage_16x9')
        if not holdingimagejson:
            return ''
        holdingimagedata = json.loads(holdingimagejson)
        if 'url_16x9' not in holdingimagedata or holdingimagedata['url_16x9'] == '':
            if 'id_16x9' not in holdingimagedata:
                return ''
            return Image(holdingimagedata['id_16x9']).fetch_thumbnail()
        return holdingimagedata.get('url_16x9', '')

    def get_title(self):
        return self.get(const.GNM_MASTERS_WEBSITE_HEADLINE)

    def get_type(self):
        return const.GNM_MASTER_TYPE

    @staticmethod
    def apply_metadata_inheritance(data, project):
        '''
        Upon creation several metadata fields should get duplicated data as initial values.
        This data either comes from other Master/Asset metadata fields or the parent projects metadata.

        This method is static to allow it to be called before doing the initial metadatacreation in Vidispine.

        Keyword arguments:
            data -- dict with current masters data.
            project -- parent project the master will belong to once created.

        Returns:
            dict with updated metadata, ready to be used for creating a master
        '''
        from default_metadata_values import MASTER_METADATA_DEFAULT_VALUES
        # Asset title used as representation in some places
        data[const.GNM_ASSET_TITLE] = data[const.GNM_MASTERS_WEBSITE_HEADLINE]
        # Duplicate values from the generic form into other forms values according to mapping (external file).
        data[const.GNM_MASTERS_INTERACTIVE_TITLE] = data[const.GNM_MASTERS_WEBSITE_HEADLINE]
        data[const.GNM_MASTERS_INTERACTIVE_PROJECTREF] = project.id
        data[const.GNM_MASTERS_YOUTUBE_TITLE] = data[const.GNM_MASTERS_WEBSITE_HEADLINE]
        data[const.GNM_MASTERS_YOUTUBE_DESCRIPTION] = data[const.GNM_MASTERS_WEBSITE_STANDFIRST]
        data[const.GNM_MASTERS_YOUTUBE_KEYWORDS] = data[const.GNM_MASTERS_WEBSITE_TAGS]
        data[const.GNM_MASTERS_YOUTUBE_CONTAINSADULTCONTENT] = data[const.GNM_MASTERS_GENERIC_CONTAINSADULTCONTENT]
        data[const.GNM_MASTERS_YOUTUBE_PUBLISH] = data[const.GNM_MASTERS_GENERIC_PUBLISH]
        data[const.GNM_MASTERS_YOUTUBE_REMOVE] = data[const.GNM_MASTERS_GENERIC_REMOVE]
        data[const.GNM_MASTERS_YOUTUBE_MATCHINGPOLICY] = [const.GNM_MASTERS_YOUTUBE_MATHCHINGPOLICY_TRUE] if data[const.GNM_MASTERS_GENERIC_WHOLLYOWNED] else []
        data[const.GNM_MASTERS_YOUTUBE_ALLOWCOMMENTS] = MASTER_METADATA_DEFAULT_VALUES[const.GNM_MASTERS_YOUTUBE_ALLOWCOMMENTS]
        data[const.GNM_MASTERS_YOUTUBE_ALLOWRESPONSES] = MASTER_METADATA_DEFAULT_VALUES[const.GNM_MASTERS_YOUTUBE_ALLOWRESPONSES]
        data[const.GNM_MASTERS_YOUTUBE_ALLOWRATINGS] = MASTER_METADATA_DEFAULT_VALUES[const.GNM_MASTERS_YOUTUBE_ALLOWRATINGS]
        data[const.GNM_MASTERS_YOUTUBE_ALLOWEMBEDDING] = MASTER_METADATA_DEFAULT_VALUES[const.GNM_MASTERS_YOUTUBE_ALLOWEMBEDDING]
        data[const.GNM_MASTERS_YOUTUBE_EMBEDDABLE] = MASTER_METADATA_DEFAULT_VALUES[const.GNM_MASTERS_YOUTUBE_EMBEDDABLE]
        data[const.GNM_MASTERS_YOUTUBE_NOTIFY_CHANNEL_SUBSCRIBERS] = MASTER_METADATA_DEFAULT_VALUES[const.GNM_MASTERS_YOUTUBE_NOTIFY_CHANNEL_SUBSCRIBERS]
        data[const.GNM_MASTERS_DAILYMOTION_TITLE] = data[const.GNM_MASTERS_WEBSITE_HEADLINE]
        data[const.GNM_MASTERS_DAILYMOTION_DESCRIPTION] = data[const.GNM_MASTERS_WEBSITE_STANDFIRST]
        data[const.GNM_MASTERS_DAILYMOTION_KEYWORDS] = data[const.GNM_MASTERS_WEBSITE_TAGS]
        data[const.GNM_MASTERS_DAILYMOTION_PUBLISH] = data[const.GNM_MASTERS_GENERIC_PUBLISH]
        data[const.GNM_MASTERS_DAILYMOTION_CONTAINSADULTCONTENT] = data[const.GNM_MASTERS_GENERIC_CONTAINSADULTCONTENT]
        data[const.GNM_MASTERS_DAILYMOTION_AUTHOR] = data[const.GNM_ASSET_OWNER]
        data[const.GNM_MASTERS_DAILYMOTION_NOMOBILEACCESS] = [const.GNM_MASTERS_DAILYMOTION_NOMOBILEACCESS_TRUE] if data[const.GNM_MASTERS_GENERIC_PREVENTMOBILEUPLOAD] else []
        data[const.GNM_MASTERS_MAINSTREAMSYNDICATION_TITLE] = data[const.GNM_MASTERS_WEBSITE_HEADLINE]
        data[const.GNM_MASTERS_MAINSTREAMSYNDICATION_DESCRIPTION] = data[const.GNM_MASTERS_WEBSITE_STANDFIRST]
        data[const.GNM_MASTERS_MAINSTREAMSYNDICATION_KEYWORDS] = data[const.GNM_MASTERS_WEBSITE_TAGS]
        data[const.GNM_MASTERS_MAINSTREAMSYNDICATION_CONTAINSADULTCONTENT] = data[const.GNM_MASTERS_GENERIC_CONTAINSADULTCONTENT]
        data[const.GNM_MASTERS_MAINSTREAMSYNDICATION_PUBLISH] = data[const.GNM_MASTERS_GENERIC_PUBLISH]
        data[const.GNM_MASTERS_MAINSTREAMSYNDICATION_AUTHOR] = data[const.GNM_ASSET_OWNER]
        return data

    def generate_and_set_new_title_id(self, project):
        '''generate_and_set_new_title_id
        Generate a title id for this master and set the field to that value.
        Sets value to empty string on any error.

        Keyword arguments:
            project -- VSProject object. Supplied because it will save us Vidispine calls.
        '''
        if not hasattr(settings, 'TITLE_ID_SCRIPT'):
            logger.warning('TITLE_ID_SCRIPT not set')
            return

        commission_id = project.get_parent_commission().id
        project_id = project.id
        command = '{base} --commission-id {c_id} --project-id {p_id} --master-id {m_id}'.format(
            base=settings.TITLE_ID_SCRIPT,
            c_id=commission_id,
            p_id=project_id,
            m_id=self.id,
        )
        p = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        output, err = p.communicate()
        output = output.strip()  # Remove trailing whitespace, linefeeds and other similar noise causing issues 
        retcode = p.poll()
        if retcode != 0:
            self.set(const.GNM_MASTERS_GENERIC_TITLEID, '')
            # Returncode indicating it was not able to run the script for some reason, e.g. no such file or directory.
            if retcode == 127:
                logger.error('Failed to run generating title id script. Stdout: {out}  Stderr: {err}'.format(
                    out=output,
                    err=err,
                ))
            else:
                logger.error('Generating title id script failed with code {exit_code}. Stdout: {out}  Stderr: {err}'.format(
                    out=output,
                    err=err,
                    exit_code=str(retcode),
                ))
        else:
            self.set(const.GNM_MASTERS_GENERIC_TITLEID, output)

    def _apply_storage_rule(self, user): # deprecated
        from portal.plugins.gnm_storagerules import storage_rules
        from portal.plugins.gnm_storagerules.exceptions import StorageConfigurationError
        try:
            return storage_rules.apply_storage_rule(self)
        except StorageConfigurationError:
            # TODO alert user and/or admin about the configuration error
            logger.error('Storage groups are not properly configured')
        return False

    def get_portal_item_and_previews(self, user):
        from portal.vidispine.iitem import ItemHelper, getPreviewsByShapes
        item = ItemHelper(runas=user).getItem(item_id=self.id)
        _custom_metadata, _system_metadata, _system_specific_metadata = item.getMetadata()

        if 'mediaType' in _system_metadata:
            _mediaType = _system_metadata['mediaType']
        else:
            _mediaType = 'video'
        previews = getPreviewsByShapes(item, _mediaType)

        return item, previews

    def get_used_clips(self):
        pacman_clips = PACMANClip.objects.filter(master_id=self.id)
        ret = []
        for clip in pacman_clips:
            try:
                asset = VSAsset(id=clip.asset_id, user=self.user)
            except VSException:
                asset = None
            ret.append({
                'id': clip.asset_id,
                'item': asset,
                'duration': clip.duration,
                'sound': clip.sound,
                'picture': clip.picture
            })

        return ret

    def get_portal_nle_xml(self):
        '''
            Retrieve the latest version of portal_nle_xml
            The field will be deleted from Vidispine and copied to django db
        '''
        from django.conf import settings
        # TODO modify url to only retrieve generic portal_nle_xml and discard time coded and other fields?
        resp = vs_calls.get(self.pacdata_url.format(id=self.id), self.user.username)
        if is_error(resp.status_code):
            raise_error(resp)
        md_raw = parse_xml(resp.content)

        # find the latest version of portal_nle_xml in VS metadata, determined by 'timestamp' attribute
        xmeml = None
        xmeml_timestamp = dateutil.parser.parse('1979-10-22T00:00:00Z')
        delete_uuids = set()
        for f in md_raw.iter(tag('field')):
            v = f.find(tag('name'))
            if v is None:
                continue
            elif v.text != 'portal_nle_xml':
                continue
            for v in f.iter(tag('value')):
                ts = dateutil.parser.parse(v.get('timestamp', xmeml_timestamp))
                if v.text and ts >= xmeml_timestamp:
                    xmeml = v.text
                    xmeml_timestamp = ts
                delete_uuids.add(v.get('uuid'))

        if not getattr(settings, 'PORTAL_NLE_XML_LOCATION', None):
            # alternate storage for xml data not specified
            return xmeml

        xmeml_db = None
        try:
            # find latest version in django db
            xmeml_db = PortalNleXml.objects.get(item_id=self.id)
        except PortalNleXml.DoesNotExist:
            if xmeml:
                # create new version in django db
                xmeml_db = PortalNleXml(item_id=self.id, updated=xmeml_timestamp)
        if xmeml_db is not None:
            if xmeml and xmeml_db.updated <= xmeml_timestamp:
                # value in VS is newer, overwrite value in db
                self.write_portal_nle_xml(xmeml)
                xmeml_db.save()
            else:
                # value in db is newer, retrieve
                xmeml = self.read_portal_nle_xml()

        # delete values from VS
        for uuid in delete_uuids:
            vs_calls.delete('metadata/%s' % uuid, self.user.username)
        return xmeml

    def set_portal_nle_xml(self, xmeml):
        from django.conf import settings
        if not getattr(settings, 'PORTAL_NLE_XML_LOCATION', None):
            self.set(const.PORTAL_NLE_XML, xmeml)
            self.vs_save()
            return

        utcnow = datetime.datetime.utcnow()
        self.write_portal_nle_xml(xmeml)
        xmeml_db, created = PortalNleXml.objects.get_or_create(item_id=self.id, defaults={'updated': utcnow})
        if not created:
            xmeml_db.updated = utcnow
            xmeml_db.save()

    def read_portal_nle_xml(self):
        from django.conf import settings
        xml = os.path.join(settings.PORTAL_NLE_XML_LOCATION, '%s.xml' % self.id)
        with open(xml, 'r') as f:
            return f.read()

    def write_portal_nle_xml(self, xmeml):
        from django.conf import settings
        xml = os.path.join(settings.PORTAL_NLE_XML_LOCATION, '%s.xml' % self.id)
        with open(xml, 'w') as f:
            f.write(xmeml)

    def create_pacdata_db_cache(self):
        from portal.plugins.gnm_pacman.models import MissingFile
        xmeml = self.get_portal_nle_xml()

        if not xmeml:
            logger.info("{0}: PAC data is missing".format(self.id))
            self.update_metadata_values({const.GNM_MASTERS_GENERIC_PACDATA_STAUS: const.PACMAN_MISSING})
            self.vs_save()
            return
        else:
            have_missing = False
            ms = Timeline(xmeml)
            clips = ms.get_used_clips()

            current_pacman_clips = PACMANClip.objects.filter(master_id=self.id)
            logger.info("{0}: Deleting {1} PACMAN clips to re-create".format(self.id, current_pacman_clips.count()))
            current_pacman_clips.delete()

            count=0
            missing=0
            for clip in clips:
                PACMANClip.objects.create(
                    master_id=self.id,
                    asset_id=clip.id,
                    duration=clip.duration,
                    sound=clip.audio,
                    picture=clip.video
                )
                count+=1
                if '/' in str(clip.id):
                    have_missing = True
                    MissingFile.record_file(clip.id,self.id)
                    msg = 'Missing file in PAC-data'
                    _inform_sentry(msg, extra={'master_id': self.id, 'missing_file': clip.id})
                    missing+=1
            logger.info("{0}: Created {1} new PACMAN clips. {2} files were missing.".format(self.id, count, missing))
            if have_missing:
                logger.info("{0}: final PAC form status is INCOMPLETE".format(self.id))
                self.update_metadata_values({const.GNM_MASTERS_GENERIC_PACDATA_STAUS: const.PACMAN_INCOMPLETE})
            else:
                self.update_metadata_values({const.GNM_MASTERS_GENERIC_PACDATA_STAUS: const.PACMAN_VALID})
                logger.info("{0}: final PAC form status is INCOMPLETE".format(self.id))
            logger.info("{0}: Saving master metadata".format(self.id))
            self.vs_save()


    def check_pacdata_and_create_db_cache_if_missing(self):
        if self.get(const.GNM_MASTERS_GENERIC_PACDATA_STAUS, '') == '':
            self.create_pacdata_db_cache()

    def get_ingest_job(self):
        sgn = None
        job_id = self.get(const.GNM_JOB_ID)
        if job_id is None:
            from portal.plugins.gnm_masters.models import SigniantImport
            try:
                sgn = SigniantImport.objects.get(item_id=self.id)
                if sgn.job_id:
                    job_id = sgn.job_id
                else:
                    return None
            except SigniantImport.DoesNotExist:
                return None

        from portal.vidispine.iexception import NotFoundError
        from portal.vidispine.ijob import JobHelper
        jobhelper = JobHelper(runas=self.user)
        try:
            job = jobhelper.getJob(slug=job_id)
        except NotFoundError:
            class DummyJob():
                def getStatus(self):
                    return 'FINISHED'
            logger.debug('Job with id %s not found' % job_id)
            job = DummyJob()
        job.signiant_import = sgn

        return job

    def populate_byline_if_empty(self):
        byline = self.get(const.GNM_MASTERS_WEBSITE_BYLINE)
        if byline is None or byline == '':
            contributor_ids = set([])
            used_clips = self.get_used_clips()
            if used_clips:
                for row in used_clips:
                    asset = row.get('item')
                    if asset is None:
                        # TODO alert admin through notification?
                        try:
                            project = self.get_parent_project()
                            if project is not None:
                                logger.error('Asset %s is missing in master %s from project %s' % (row['id'], self.id, project.id))
                                continue
                        except:
                            logger.error('Master %s does not have a parent project' % self.id)
                        logger.error('Asset %s is missing in master %s' % (row['id'], self.id))
                        continue
                    rightsprofile = asset.get_rights_profile()
                    for line in rightsprofile:
                        contributor_ids.add(line['contrib_id'])

            contributors = GnmContributor.objects.filter(pk__in=contributor_ids).exclude(r2_id=None)

            contributors_str = ', '.join([x.name for x in contributors])

            self.update_metadata_values({
                const.GNM_MASTERS_WEBSITE_BYLINE: contributors_str
            })

    def get_status(self):
        if hasattr(self.md, const.GNM_MASTERS_GENERIC_STATUS):
            status = self.get(const.GNM_MASTERS_GENERIC_STATUS)
            if status is not None:
                return status
        return None

    def set_field_group(self):
        vs_calls.put('item/{id}/field-group/Asset'.format(id=self.id), '', self.user.username)


class SigniantImport(django_models.Model):
    item_id = django_models.CharField(blank=False, max_length=61, unique=True)
    filename = django_models.CharField(blank=False, max_length=65531, unique=True)
    valid_filename = django_models.BooleanField()
    #ready_to_ingest = django_models.BooleanField()
    user = django_models.ForeignKey(User)
    created = django_models.DateField(auto_now_add=True) # when this model object was created
    started = django_models.DateField(null=True) # if/when job was started
    job_id = django_models.CharField(null=True, blank=False, max_length=61)


class PortalNleXml(django_models.Model):
    item_id = django_models.CharField(blank=False, max_length=61, unique=True)
    updated = django_models.DateTimeField(null=False)


class MasterModel(django_models.Model):
    class Meta:
        app_label = 'gnm_masters'

    item_id = django_models.BigIntegerField(null=False, primary_key=True)
    user = django_models.ForeignKey(User, null=False, related_name='master_user')
    title = django_models.TextField(null=False)
    created = django_models.DateTimeField(null=False)
    updated = django_models.DateTimeField(null=False, auto_now=True)
    duration = django_models.TextField(null=True)

    commission = django_models.ForeignKey('gnm_commissions.CommissionModel', null=True)
    project = django_models.ForeignKey('gnm_projects.ProjectModel', null=True)
    gnm_master_standfirst = django_models.TextField(null=True)
    gnm_master_website_headline = django_models.TextField(null=True)
    gnm_master_generic_status = django_models.TextField(null=True)
    holdingimage_16x9_url = django_models.TextField(null=True) # TODO rename
    #gnm_asset_owner = django_models.ManyToManyField(User)
    gnm_master_generic_intendeduploadplatforms = django_models.TextField(null=True)
    gnm_master_generic_publish = django_models.DateTimeField(null=True)
    gnm_master_generic_remove = django_models.DateTimeField(null=True)

    def holdingimage(self, user, default_image_url=""):
        """
        Gets the URL of either the stored holding image or the Vidispine default one if that's not there
        :param user: django.contrib.auth.models.User object representing the user making the call
        :param default_image_url: default url to return if looking up fails
        :return: URL path string
        """
        if self.holdingimage_16x9_url:
            return self.holdingimage_16x9_url
        else:
            CACHE_TIMEOUT_VALUE = 400
            cached_value = cache.get('pluto:master_holding_image_cache:{0}'.format(self.item_id))
            if cached_value:
                logger.debug("holdingimage: returning cached value")
                return cached_value

            url = 'item/{0}-{1}/metadata;field=representativeThumbnailNoAuth'.format(vs_helpers.site_id, self.item_id)
            result = vs_calls.get(url, user,accept='application/json')
            if result.status_code!=200:
                logger.error("Retrieving thumbnail image: Vidispine returned {0} for {1}".format(result.status_code,url))
                return default_image_url
            try:
                content = result.json()
                value = content['item'][0]['metadata']['timespan'][0]['field'][0]['value'][0]['value']
                logger.debug("holdingimage: caching {0} for {1}".format(value, 'pluto:master_holding_image_cache:{0}'.format(self.item_id)))
                cache.set('pluto:master_holding_image_cache:{0}'.format(self.item_id), value, CACHE_TIMEOUT_VALUE)
                return value
            except IndexError: #the metadata did not contain the field we were after
                return default_image_url
            except Exception as e:
                logger.error(traceback.format_exc())
                return default_image_url

    @staticmethod
    def parse_datetime(dt):
        if not dt:
            return None
        return dateutil.parser.parse(dt)

    @staticmethod
    def create_from_master(master, user, vs_commission, vs_project):
        from signals import post_create_master
        m = MasterModel.objects.create(item_id=master.id.rsplit('-', 1)[1],
                                       user=user,
                                       title=master.get('title', ''),
                                       created=dateutil.parser.parse(master.get('created', datetime.datetime.now(pytz.utc).isoformat())),
                                       duration=MasterModel._duration(master),
                                       commission_id=vs_commission.id.rsplit('-', 1)[1],
                                       project_id=vs_project.id.rsplit('-', 1)[1],
                                       gnm_master_website_headline=master.get(const.GNM_MASTERS_WEBSITE_HEADLINE, None),
                                       gnm_master_generic_status=master.get(const.GNM_MASTERS_GENERIC_STATUS, None),
                                       holdingimage_16x9_url=master.holdingimage_16x9_url(),
                                       gnm_master_generic_intendeduploadplatforms=MasterModel._destinations(master),
                                       gnm_master_generic_publish=MasterModel.parse_datetime(master.get('gnm_master_generic_publish', None)),
                                       gnm_master_generic_remove=MasterModel.parse_datetime(master.get('gnm_master_generic_remove', None)),
                                      )
                                       #gnm_master_standfirst=master.get(const.GNM_MASTER_STANDFIRST, None))
        post_create_master.send_robust(sender=MasterModel.__class__, master_model=m, vs_master=None)
        return m

    @staticmethod
    def get_or_create_from_master(master, user, vs_commission=None, vs_project=None):
        from signals import post_create_master
        defaults = {'user': user,
                    'title': master.get('title', ''),
                    'created': dateutil.parser.parse(master.get('created', datetime.datetime.now(pytz.utc).isoformat())),
                    'duration': MasterModel._duration(master),
                    'gnm_master_website_headline': master.get(const.GNM_MASTERS_WEBSITE_HEADLINE, None),
                    'gnm_master_generic_status': master.get(const.GNM_MASTERS_GENERIC_STATUS, None),
                    'holdingimage_16x9_url': master.holdingimage_16x9_url(),
                    'gnm_master_generic_intendeduploadplatforms': MasterModel._destinations(master),
                    'gnm_master_generic_publish': MasterModel.parse_datetime(master.get('gnm_master_generic_publish', None)),
                    'gnm_master_generic_remove': MasterModel.parse_datetime(master.get('gnm_master_generic_remove', None)),
                   }#'gnm_master_standfirst': master.get(const.GNM_MASTER_STANDFIRST, None)}
        if vs_commission is not None:
            defaults['commission_id'] = vs_commission.id.rsplit('-', 1)[1]
        if vs_project is not None:
            defaults['project_id'] = vs_project.id.rsplit('-', 1)[1]
        try:
            (m, created) = MasterModel.objects.get_or_create(item_id=master.id.rsplit('-', 1)[1], defaults=defaults)
            if created:
                post_create_master.send_robust(sender=MasterModel.__class__, master_model=m, vs_master=master)
            return m, created
        except IntegrityError as x:
            if vs_commission is None and vs_project is None:
                vs_project = master.get_parent_project()
                if vs_project is None:
                    raise Exception('Master %s has no parent project' % master.id)
                vs_commission = vs_project.get_parent_commission()
                if vs_commission is None:
                    raise Exception('Project %s has no parent commission' % vs_project.id)
                defaults['commission_id'] = vs_commission.id.rsplit('-', 1)[1]
                defaults['project_id'] = vs_project.id.rsplit('-', 1)[1]
                return MasterModel.objects.get_or_create(item_id=master.id.rsplit('-', 1)[1], defaults=defaults)
            raise x

    def update_from_master(self, vs_master, user=None, vs_commission=None, vs_project=None):
        if user is not None:
            self.user = user
        if vs_project is None and self.project_id is None:
            vs_project = vs_master.get_parent_project()
        if vs_project is not None and self.project_id is None:
            self.project_id = vs_project.id.rsplit('-', 1)[1]
        if vs_commission is None and self.commission_id is None and vs_project is not None:
            vs_commission = vs_project.get_parent_commission()
        if vs_commission is not None and self.commission_id is None:
            self.commission_id = vs_commission.id.rsplit('-', 1)[1]
        self.title = vs_master.get('title', '')
        self.duration = MasterModel._duration(vs_master)
        self.gnm_master_website_headline = vs_master.get(const.GNM_MASTERS_WEBSITE_HEADLINE, None)
        self.gnm_master_generic_status = vs_master.get(const.GNM_MASTERS_GENERIC_STATUS, None)
        self.holdingimage_16x9_url = vs_master.holdingimage_16x9_url()
        self.gnm_master_generic_intendeduploadplatforms = MasterModel._destinations(vs_master)
        self.gnm_master_generic_publish = MasterModel.parse_datetime(vs_master.get('gnm_master_generic_publish', None))
        self.gnm_master_generic_remove = MasterModel.parse_datetime(vs_master.get('gnm_master_generic_remove', None))

    def update_owner(self, vs_master):
        return # disabled for now
        new_owners = set(int(x) for x in vs_master.get(const.GNM_ASSET_OWNER, []))
        for owner in self.gnm_asset_owner.all():
            if owner.id in new_owners:
                new_owners.remove(owner.id)
            else:
                self.gnm_asset_owner.remove(owner)
        for owner_id in new_owners:
            try:
                u = User.objects.get(id=owner_id)
                self.gnm_asset_owner.add(u)
            except User.DoesNotExist:
                logger.error('User with id=%s not found' % owner_id)

    @staticmethod
    def _destinations(vs_master):
        destinations = vs_master.get(const.GNM_MASTERS_GENERIC_INTENDEDUPLOADPLATFORMS, None)
        if not destinations:
            return None
        elif isinstance(destinations, basestring):
            return destinations
        else:
            return ','.join(destinations)

    @staticmethod
    def _duration(vs_master):
        portal_item, portal_preview = vs_master.get_portal_item_and_previews(vs_master.user)
        timecode = portal_item.getDurationTimecode()
        if timecode:
            return timecode.toSMPTE()
