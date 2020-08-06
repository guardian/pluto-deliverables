
# coding: utf-8
from django.contrib.auth.models import User
from django.shortcuts import redirect
from django.core.urlresolvers import reverse
from django.core.exceptions import ValidationError
from django.contrib import messages
from django.http import HttpResponse, HttpResponseRedirect
from django.conf import settings
from rest_framework.parsers import FileUploadParser
from django.views.generic import View
from portal.plugins.gnm_masters.forms import MasterGenericForm, MasterDailyMotionForm, MasterInteractiveForm, MasterWebsiteForm, MasterMainstreamSyndicationForm, MasterYoutubeForm, MasterMediaAtomForm, MastersSearchForm, MasterSpotifyForm, MasterFacebookForm, MasterFacebookCallToActionForm
from portal.plugins.gnm_assets.forms import AssetForm
from portal.plugins.gnm_masters.models import VSMaster, SigniantImport, MasterModel
from portal.plugins.gnm_misc_utils.helpers import parse_xml, inform_sentry
from portal.plugins.gnm_projects.models import VSProject, ProjectModel
from portal.plugins.gnm_projects.exceptions import NotAProjectError
from portal.plugins.gnm_masters.exceptions import NotAMasterError
from portal.plugins.gnm_vidispine_utils import constants as const
from portal.plugins.gnm_vidispine_utils import vs_helpers
from portal.plugins.gnm_vidispine_utils.models import Reference
from portal.plugins.gnm_misc_utils.views import GuardianBaseView
from portal.plugins.gnm_misc_utils.admin_only_fields import MASTERS_ASSET_ADMIN_ONLY_FIELDS, MASTERS_GENERIC_ADMIN_ONLY_FIELDS, MASTERS_WEBSITE_ADMIN_ONLY_FIELDS, MASTERS_INTERACTIVE_ADMIN_ONLY_FIELDS, MASTERS_YOUTUBE_ADMIN_ONLY_FIELDS, MASTERS_SPOTIFY_ADMIN_ONLY_FIELDS, MASTERS_DAILYMOTION_ADMIN_ONLY_FIELDS, MASTERS_MAINSTREAMSYNDICATION_ADMIN_ONLY_FIELDS, MASTER_ADMIN_ONLY_FIELDS, MASTERS_FACEBOOK_CALL_TO_ACTION_ADMIN_ONLY_FIELDS, MASTERS_FACEBOOK_ADMIN_ONLY_FIELDS
from portal.plugins.gnm_smartsearches.views import SearchMastersAPIView, ModelSearchAPIView
from portal.plugins.gnm_vidispine_utils import vs_calls
from portal.plugins.gnm_vidispine_errors.error_handling import is_error, log_vs_error_from_resp, raise_error
from portal.plugins.gnm_vidispine_utils.md_utils import tag, E, get_jobid
from portal.utils.templatetags.permissionrequired import has_role
from portal.plugins.gnm_masters.forms import MasterMediawallForm
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer,XMLRenderer, YAMLRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from lxml import etree as ET
from django.http import Http404
from django.db.models import Q
from django.template.defaultfilters import slugify
import uuid
import urllib.request, urllib.parse, urllib.error
import logging
import os
import os.path
import re

log = logging.getLogger(__name__)
log.level = logging.DEBUG


class MasterListView(GuardianBaseView):
    def get(self, request):
        log.info('GET Master list')
        working_groups = vs_helpers.working_groups
        working_group_names = [x.get('name') for x in working_groups]
        user_workinggroups = request.user.groups.filter(name__in=working_group_names)

        for group in working_groups:
            for user_group in user_workinggroups:
                if user_group.name == group['name']:
                    group['load_on_pageload'] = True

        search_form = MastersSearchForm()
        return self.main(request, self.template, extra_context={
            'search_form': search_form,
            'working_groups': working_groups,
        })

    def get_template(self, template_name):
        return super(MasterListView, self).get_template('gnm_masters/master_list.html')


class MasterSearchView(GuardianBaseView):
    def get(self, request):
        search_string = request.GET.get('freetext')
        return self.main(request, self.template, extra_context={
            'search': search_string,
        })

    def get_template(self, template_name):
        return super(MasterSearchView, self).get_template('gnm_masters/master_search.html')


class MasterSearchAPIView_old(SearchMastersAPIView):
    def base_search(self):
        return VSMaster.search_criteria()


class MasterSearchAPIView(ModelSearchAPIView):

    def objects(self):
        return MasterModel.objects

    def columns(self):
        return ('', 'gnm_master_website_headline', 'commission__gnm_commission_title', 'project__gnm_project_headline', 'commission__gnm_commission_workinggroup', 'gnm_master_generic_intendeduploadplatforms', 'gnm_master_generic_publish', 'gnm_master_generic_remove', 'created', 'gnm_master_generic_status', 'duration', '')

    def search_columns(self):
        return ('gnm_master_website_headline', 'gnm_master_standfirst')

    def prepare_data(self, data, hits):
        return [self.item(x) for x in data]

    def item(self, master):
        image = '<img src="%s" />' % master.holdingimage(user=self.request.user,default_image_url="/sitemedia/img/no-thumbnail.png")

        status_value = master.gnm_master_generic_status if master.gnm_master_generic_status else 'Draft' # TODO correct default value?
        status = '<img src="/sitemedia/img/gnm/%s.png" title="%s" />' % (slugify(status_value), status_value)

        destinations = master.gnm_master_generic_intendeduploadplatforms
        if destinations:
            destinations = destinations.split(',')
            # Guardian wants a very specific order for the destinations. Website should also be displayed as Guardian
            correct_order = {
                'website': 1,
                'interactive': 2,
                'youtube': 3,
                'daily motion': 4,
                'mainstream syndication': 5,
                'spotify': 6,
            }
            sorted_destinations = sorted(destinations, key=lambda x: correct_order[x.lower()])
            destinations = ', '.join(sorted_destinations)
            destinations = destinations.replace('Website', 'Guardian')

        return [
            image,
            master.gnm_master_website_headline,
            master.commission.gnm_commission_title if master.commission is not None else 'UNKNOWN',
            master.project.gnm_project_headline if master.project is not None else 'UNKNOWN',
            vs_helpers.resolve_working_group(master.commission.gnm_commission_workinggroup) if master.commission is not None else 'UNKNOWN',
            destinations,
            ModelSearchAPIView.dateformat(master.gnm_master_generic_publish),
            ModelSearchAPIView.dateformat(master.gnm_master_generic_remove),
            ModelSearchAPIView.dateformat(master.created),
            status,
            master.duration,
            '%s-%s' % (vs_helpers.site_id, master.item_id),
            ('%s-%s' % (vs_helpers.site_id, master.project.collection_id)) if master.project is not None else '',
        ]



class MasterListMineAPIView_old(MasterSearchAPIView):

    def base_search(self):
        criteria = '<AND><user>{user}</user></AND>'.format(
            user=self.request.user.username,
        )
        return VSMaster.search_criteria(criteria)


class MasterListMineAPIView(MasterSearchAPIView):
    def filter(self, user):
        return Q(user=user) # TODO | owner?


class MasterListAPIView(MasterSearchAPIView):
    def get(self, request, uuid):
        self.uuid = uuid
        return super(MasterListAPIView, self).get(request)

    def filter(self, user):
        return Q(commission__gnm_commission_workinggroup=self.uuid)


class MasterListAPIView_old(MasterSearchAPIView):

    def get(self, request, uuid):
        self.uuid = uuid
        return super(MasterListAPIView, self).get(request)

    def base_search(self):
        criteria = '<AND><{workinggroup}>{uuid}</{workinggroup}></AND>'.format(
            workinggroup=const.GNM_COMMISSION_WORKINGGROUP,
            uuid=self.uuid,
        )
        return VSMaster.search_criteria(criteria)


class MasterListForParentCollectionAPIView(MasterSearchAPIView):

    def get(self, request, collection_id):
        self.collection_id = collection_id.rsplit('-', 1)[1]
        return super(MasterListForParentCollectionAPIView, self).get(request)

    def filter(self, user):
        return Q(commission_id=self.collection_id) | Q(project_id=self.collection_id)


class MasterListForParentCollectionAPIView_old(MasterSearchAPIView):
    def get(self, request, collection_id):
        self.collection_id = collection_id
        self.request = request
        return super(MasterListForParentCollectionAPIView, self).get(request)

    def base_search(self):
        criteria = '<AND><__ancestor_collection>{id}</__ancestor_collection></AND>'.format(
            id=self.collection_id,
        )
        return VSMaster.search_criteria(criteria)


class MasterNewView(GuardianBaseView):
    def get(self, request):
        project_id = self.kwargs.get('project_id')
        try:
            project = VSProject(project_id, self.request.user)
            pm, created = ProjectModel.get_or_create_from_project(project, project.user)
        except NotAProjectError:
            '''
            display that someone is trying to create a master that wont belong to a project
            and that is verboten!
            FIXME
            Probably shouldn't raise a 404 but it's something
            '''
            raise Http404
        initial_data = MasterNewView._initial_data(project, request.user)
        genericform = MasterGenericForm(initial=initial_data)
        assetform = AssetForm(initial=initial_data)
        websiteform = MasterWebsiteForm(initial=initial_data)

        if not has_role(request.user, '_administrator'):
            for field in MASTERS_ASSET_ADMIN_ONLY_FIELDS:
                assetform.fields[field].widget.attrs['disabled'] = 'disabled'
                assetform.fields[field].widget.attrs['readonly'] = 'readonly'
                assetform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_GENERIC_ADMIN_ONLY_FIELDS:
                genericform.fields[field].widget.attrs['disabled'] = 'disabled'
                genericform.fields[field].widget.attrs['readonly'] = 'readonly'
                genericform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_WEBSITE_ADMIN_ONLY_FIELDS:
                websiteform.fields[field].widget.attrs['disabled'] = 'disabled'
                websiteform.fields[field].widget.attrs['readonly'] = 'readonly'
                websiteform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

        return self.main(request, self.template, extra_context={
            'genericform': genericform,
            'assetform': assetform,
            'project': project,
            'projectmodel': pm,
            'image_collection': project_id,
            'websiteform': websiteform,
        }, )

    @staticmethod
    def _initial_data(project, user):
        return {
            const.GNM_MASTERS_GENERIC_PUBLISH: project.get(const.GNM_PROJECT_PUBLISH),
            const.GNM_MASTERS_GENERIC_REMOVE: project.get(const.GNM_PROJECT_REMOVE),
            const.GNM_ASSET_OWNER: str(user.pk),
            const.GNM_ASSET_KEYWORDS: project.get(const.GNM_PROJECT_TAGS),
            const.GNM_MASTERS_WEBSITE_HEADLINE: project.get(const.GNM_PROJECT_HEADLINE),
            const.GNM_MASTERS_WEBSITE_TRAIL: project.get(const.GNM_PROJECT_TRAIL),
            const.GNM_ASSET_DESCRIPTION: project.get(const.GNM_PROJECT_STANDFIRST),
            const.GNM_ASSET_CATEGORY: 'Master',
            const.GNM_MASTERS_GENERIC_SOURCE: 'guardian.co.uk',
            const.GNM_MASTERS_GENERIC_LANGUAGE: 'en',
            const.GNM_MASTERS_GENERIC_LICENSOR: project.get(const.GNM_PROJECT_LICENSOR),
            const.GNM_MASTERS_GENERIC_INTENDEDUPLOADPLATFORMS: project.get(const.GNM_PROJECT_INTENDEDUPLOADPLATFORMS),
            const.GNM_MASTERS_GENERIC_CONTAINSADULTCONTENT: project.get(const.GNM_PROJECT_CONTAINSADULTCONTENT),
            const.GNM_MASTERS_GENERIC_UKONLY: project.get(const.GNM_PROJECT_UKONLY),
            const.GNM_MASTERS_GENERIC_WHOLLYOWNED: project.get(const.GNM_PROJECT_WHOLLYOWNED),
            const.GNM_MASTERS_WEBSITE_STANDFIRST: project.get(const.GNM_PROJECT_STANDFIRST),
            const.GNM_MASTERS_WEBSITE_BYLINE: project.get(const.GNM_PROJECT_BYLINE),
            const.GNM_STORAGE_RULE_SENSITIVE: project.get(const.GNM_STORAGE_RULE_SENSITIVE),
            const.GNM_STORAGE_RULE_DELETABLE: project.get(const.GNM_STORAGE_RULE_DELETABLE),
            const.GNM_STORAGE_RULE_DEEP_ARCHIVE: const.GNM_STORAGE_RULE_DEEP_ARCHIVE_TRUE,
        }

    @staticmethod
    def _references(project):
        references = []
        commission_workinggroup_uuid = project.get_workinggroup_reference_uuid()
        commission_title_uuid = project.get_commission_title_reference_uuid()
        project_headline_uuid = project.get_headline_reference_uuid()
        if commission_workinggroup_uuid is not None:
            references.append(Reference(name=const.GNM_COMMISSION_WORKINGGROUP, uuid=commission_workinggroup_uuid))
        if commission_title_uuid is not None:
            references.append(Reference(name=const.GNM_COMMISSION_TITLE, uuid=commission_title_uuid))
        if project_headline_uuid is not None:
            references.append(Reference(name=const.GNM_PROJECT_HEADLINE, uuid=project_headline_uuid))
        return references

    def post(self, request):
        import copy
        from portal.plugins.gnm_notifications.models import send_notification
        from portal.plugins.gnm_notifications.choices import NOTIFICATION_TYPE_MASTER, NOTIFICATION_SEVERITY_INFO
        project_id = self.kwargs.get('project_id')
        log.debug("create master: project id: {0}".format(project_id))
        try:
            project = VSProject(project_id, self.request.user)
        except NotAProjectError:
            '''
            display that someone is trying to create a master that wont belong to a project
            and that is verboten!
            FIXME
            Probably shouldn't raise a 404 but it's something
            '''
            raise Http404
        log.debug("create master: setting up forms")
        genericform = MasterGenericForm(request.POST)
        assetform = AssetForm(request.POST)
        websiteform = MasterWebsiteForm(request.POST)

        if genericform.is_valid() and assetform.is_valid() and websiteform.is_valid():
            log.debug("create master: forms are valid")
            data_copy = copy.deepcopy(genericform.cleaned_data)
            data_copy.update(assetform.cleaned_data)  # update from asset should be fine, no asset fields inherit data from other fields
            data_copy.update(websiteform.cleaned_data)
            if not has_role(request.user, '_administrator'):
                initial_values = MasterNewView._initial_data(project, request.user)
                for field in MASTERS_ASSET_ADMIN_ONLY_FIELDS:
                    initial_value = initial_values.get(field, '')
                    data_copy[field] = initial_value
                for field in MASTERS_GENERIC_ADMIN_ONLY_FIELDS:
                    initial_value = initial_values.get(field, '')
                    data_copy[field] = initial_value
                for field in MASTERS_WEBSITE_ADMIN_ONLY_FIELDS:
                    initial_value = initial_values.get(field, '')
                    data_copy[field] = initial_value

            log.debug("create master: apply metadata inheritance")
            data = VSMaster.apply_metadata_inheritance(data=data_copy, project=project)
            log.debug("create master: get parent references")
            references = MasterNewView._references(project)

            log.debug("create master: creating vsmaster object")
            master = VSMaster.vs_create(data, request.user, references=references, parent_project=project)
            log.debug("create master: generate and set title id")
            master.generate_and_set_new_title_id(project)
            log.debug("create master: updating md values")
            master.update_metadata_values({
                const.GNM_MASTERS_SPOTIFY_TITLE_ID: "GM{id_without_dash}{padding}".format(id_without_dash=master.id.replace('-', ''), padding="00000000000000000000")[:24],
                const.GNM_MASTERS_SPOTIFY_ID: "GE{id_without_dash}{padding}".format(id_without_dash=master.id.replace('-', ''), padding="00000000000000000000")[:24],
                const.GNM_MASTERS_SPOTIFY_LICENSOR: master.get(const.GNM_MASTERS_GENERIC_LICENSOR)
            })
            log.debug("create master: saving VS record")
            master.vs_save()
            # Add to Project
            log.debug("create master: adding to project container")
            project.add_master(master)

            log.debug("create master: sending notification")
            send_notification(
                type=NOTIFICATION_TYPE_MASTER,
                severity=NOTIFICATION_SEVERITY_INFO,
                to=project.subscribers(),
                object_type='Master',
                object_id=master.id,
                message='Master created: {title}'.format(title=master.get(const.GNM_MASTERS_WEBSITE_HEADLINE, '')),
                url=reverse('master', args=[master.id]))

            log.debug("create master: completed.")
            messages.info(request, 'Master created')

            log.debug("create master: redirecting to {0}".format(reverse('master_ingest', args=[master.id]) + '?show_skip=1'))
            return redirect(reverse('master_ingest', args=[master.id]) + '?show_skip=1')

        log.debug("create master: forms contained errors")
        messages.error(request, 'The form contain errors')
        log.debug("create master (errored): get project model")
        pm, created = ProjectModel.get_or_create_from_project(project, project.user)

        log.debug("create master (errored): reshow form")

        return self.main(request, self.template, extra_context={
            'genericform': genericform,
            'assetform': assetform,
            'project': project,
            'projectmodel': pm,
            'image_collection': project_id,
        }, )

    def is_valid_project(self, project_id):
        return True

    def get_template(self, template_name):
        return super(MasterNewView, self).get_template('gnm_masters/master_new.html')


class MasterView(GuardianBaseView):
    def get(self, request):
        from portal.plugins.gnm_misc_utils.helpers import inform_sentry_exception
        try:
            return self.inner_get(request)
        except NotAMasterError as e:
            masterid = self.kwargs.get('master_id')
            inform_sentry_exception("tried to open a master that as not a master ({0})".format(masterid))
            return HttpResponseRedirect(redirect_to='/vs/item/{0}'.format(masterid))

    def inner_get(self, request):
        master = vs_helpers.get_vsobject_or_404(VSMaster, self.kwargs.get('master_id'), request.user)
        mm, created = MasterModel.get_or_create_from_master(master, master.user)
        if not (created or (mm.commission_id and mm.project_id)):
            msg = 'Master model %s has no commission/project, attempt to resolve' % self.kwargs.get('master_id')
            log.warning(msg)
            inform_sentry(msg)
            mm.update_from_master(master)
            mm.save()

        portal_item, portal_previews = master.get_portal_item_and_previews(request.user)
        assetform = AssetForm(instance=master)

        genericform = MasterGenericForm(instance=master)
        dailymotionform = MasterDailyMotionForm(instance=master)
        interactiveform = MasterInteractiveForm(instance=master)
        websiteform = MasterWebsiteForm(instance=master)
        syndicationform = MasterMainstreamSyndicationForm(instance=master)
        youtubeform = MasterYoutubeForm(instance=master)
        mediaatomform = MasterMediaAtomForm(instance=master)
        spotifyform = MasterSpotifyForm(instance=master)
        facebookform = MasterFacebookForm(instance=master)
        facebook_actionform = MasterFacebookCallToActionForm(instance=master)
        mastermediawallform = MasterMediawallForm(instance=master)

        if not has_role(request.user, '_administrator'):
            for field in MASTERS_ASSET_ADMIN_ONLY_FIELDS:
                assetform.fields[field].widget.attrs['disabled'] = 'disabled'
                assetform.fields[field].widget.attrs['readonly'] = 'readonly'
                assetform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_GENERIC_ADMIN_ONLY_FIELDS:
                genericform.fields[field].widget.attrs['disabled'] = 'disabled'
                genericform.fields[field].widget.attrs['readonly'] = 'readonly'
                genericform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_WEBSITE_ADMIN_ONLY_FIELDS:
                websiteform.fields[field].widget.attrs['disabled'] = 'disabled'
                websiteform.fields[field].widget.attrs['readonly'] = 'readonly'
                websiteform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_INTERACTIVE_ADMIN_ONLY_FIELDS:
                interactiveform.fields[field].widget.attrs['disabled'] = 'disabled'
                interactiveform.fields[field].widget.attrs['readonly'] = 'readonly'
                interactiveform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_YOUTUBE_ADMIN_ONLY_FIELDS:
                youtubeform.fields[field].widget.attrs['disabled'] = 'disabled'
                youtubeform.fields[field].widget.attrs['readonly'] = 'readonly'
                youtubeform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_SPOTIFY_ADMIN_ONLY_FIELDS:
                spotifyform.fields[field].widget.attrs['disabled'] = 'disabled'
                spotifyform.fields[field].widget.attrs['readonly'] = 'readonly'
                spotifyform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_DAILYMOTION_ADMIN_ONLY_FIELDS:
                dailymotionform.fields[field].widget.attrs['disabled'] = 'disabled'
                dailymotionform.fields[field].widget.attrs['readonly'] = 'readonly'
                dailymotionform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_MAINSTREAMSYNDICATION_ADMIN_ONLY_FIELDS:
                syndicationform.fields[field].widget.attrs['disabled'] = 'disabled'
                syndicationform.fields[field].widget.attrs['readonly'] = 'readonly'
                syndicationform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_FACEBOOK_ADMIN_ONLY_FIELDS:
                facebookform.fields[field].widget.attrs['disabled'] = 'disabled'
                facebookform.fields[field].widget.attrs['readonly'] = 'readonly'
                facebookform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

            for field in MASTERS_FACEBOOK_CALL_TO_ACTION_ADMIN_ONLY_FIELDS:
                facebookform.fields[field].widget.attrs['disabled'] = 'disabled'
                facebookform.fields[field].widget.attrs['readonly'] = 'readonly'
                facebookform.fields[field].widget.attrs['class'] = 'gnm-always-disabled'

        master.check_pacdata_and_create_db_cache_if_missing()

        return self.main(request, self.template, {
            'master': master,
            'mastermodel': mm,
            'item': portal_item,
            'previews': portal_previews,
            'genericform': genericform,
            'assetform': assetform,
            'dailymotionform': dailymotionform,
            'interactiveform': interactiveform,
            'websiteform': websiteform,
            'syndicationform': syndicationform,
            'mediaatomform': mediaatomform,
            'youtubeform': youtubeform,
            'spotifyform': spotifyform,
            'facebookform': facebookform,
            'facebook_actionform': facebook_actionform,
            'mastermediawallform': mastermediawallform,
            'image_collection': mm.project_id,
            'is_update': self.is_media_update(master),
        })

    def post(self, request):
        master = vs_helpers.get_vsobject_or_404(VSMaster, self.kwargs.get('master_id'), request.user)
        mm, created = MasterModel.get_or_create_from_master(master, master.user)

        portal_item, portal_previews = master.get_portal_item_and_previews(request.user)
        assetform = AssetForm(request.POST)
        genericform = MasterGenericForm(request.POST)
        dailymotionform = MasterDailyMotionForm(request.POST)
        interactiveform = MasterInteractiveForm(request.POST)
        websiteform = MasterWebsiteForm(request.POST)
        syndicationform = MasterMainstreamSyndicationForm(request.POST)
        mediaatomform = MasterMediaAtomForm(request.POST)
        youtubeform = MasterYoutubeForm(request.POST)
        spotifyform = MasterSpotifyForm(request.POST)
        facebookform = MasterFacebookForm(request.POST)
        facebook_actionform = MasterFacebookCallToActionForm(request.POST)
        mastermediawallform = MasterMediawallForm(request.POST)

        forms = [genericform, dailymotionform, interactiveform, websiteform, syndicationform, youtubeform, spotifyform,
                 facebookform, facebook_actionform, assetform, mastermediawallform, mediaatomform]
        if all(form.is_valid() for form in forms):
            for form in forms:
                cleaned_data = form.cleaned_data
                if not has_role(request.user, '_administrator'):
                    for field in MASTER_ADMIN_ONLY_FIELDS:
                        if field in cleaned_data:
                            del cleaned_data[field]

                master.update_metadata_values(cleaned_data)

            master.populate_byline_if_empty()
            master.vs_save()

            messages.info(request, 'Master saved')

            return redirect('master', master.id)

        messages.error(request, 'The form contain errors')

        return self.main(request, self.template, {
            'master': master,
            'mastermodel': mm,
            'item': portal_item,
            'genericform': genericform,
            'assetform': assetform,
            'dailymotionform': dailymotionform,
            'interactiveform': interactiveform,
            'websiteform': websiteform,
            'syndicationform': syndicationform,
            'youtubeform': youtubeform,
            'mediaatomform': mediaatomform,
            'spotifyform': spotifyform,
            'facebookform': facebookform,
            'facebook_actionform': facebook_actionform,
            'image_collection': mm.project_id,
            'is_update': self.is_media_update(master),
        })

    def is_media_update(self, master):
        """
        Field gnm_master_generic_uploadtype should only change to Update if it has already been published.
        That is status is "Ready to Upload", "Live" or equivalent.
        This page previously (before 2014-12-05) assumed it always was an update.

        Keyword arguments:
            master -- VSMaster object
        Returns:
            String '0' for False, don't update upload type. Or '1' for True, update upload type.
        """
        current_status = master.get_status()
        if current_status is not None and (current_status == const.STATUS_READY_TO_PUBLISH or current_status == const.STATUS_PUBLISHED):
            return '1'
        return '0'

    def get_template(self, template_name):
        return super(MasterView, self).get_template('gnm_masters/master_edit.html')


class MasterUploadLogView(APIView):
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )

    def get(self, request, master_id):
        master = vs_helpers.get_vsobject_or_404(VSMaster, master_id, request.user)

        return Response({
            'website_upload_log': master.get(const.GNM_MASTERS_WEBSITE_UPLOADLOG),
            'dailymotion_upload_log': master.get(const.GNM_MASTERS_DAILYMOTION_UPLOADLOG),
            'interactive_upload_log': master.get(const.GNM_MASTERS_INTERACTIVE_UPLOADLOG),
            'mainstreamsyndication_upload_log': master.get(const.GNM_MASTERS_MAINSTREAMSYNDICATION_UPLOADLOG),
            'youtube_upload_log': master.get(const.GNM_MASTERS_YOUTUBE_UPLOADLOG),
            'facebook_upload_log': master.get(const.GNM_MASTERS_FACEBOOK_UPLOADLOG),
            'r2_url': master.get(const.GNM_MASTERS_WEBSITE_EDIT_URL),
            'mediaatom_upload_log': master.get(const.GNM_MASTERS_MEDIAATOM_UPLOADLOG),
        })


class MasterIdFileView(GuardianBaseView):
    def get(self, request):
        master_id = self.kwargs.get('master_id')

        response = HttpResponse(content=master_id, content_type='text/plain')
        response['Content-Disposition'] = 'attachment; filename="master_id.sidecar"'
        return response


class DjangoS3UploadView(View):
    def post(self,request):
        from .forms import DjangoS3UploadForm

        f=DjangoS3UploadForm(request.POST)
        if f.is_valid():
            data = f.cleaned_data
            master_id = self.kwargs.get('master_id')
            self.master = vs_helpers.get_vsobject_or_404(VSMaster, master_id, request.user)


class MasterIngestView(GuardianBaseView):
    def get(self, request):
        from .forms import DjangoS3UploadForm
        from django.conf import settings
        master_id = self.kwargs.get('master_id')
        self.master = vs_helpers.get_vsobject_or_404(VSMaster, master_id, request.user)
        try:
            sgn = SigniantImport.objects.get(item_id=master_id)
            remote_master_filename = sgn.filename
        except SigniantImport.DoesNotExist:
            remote_master_filename = ''

        include_media_shuttle = True

        if hasattr(settings,'SHOW_S3_UPLOAD') and settings.SHOW_S3_UPLOAD:
            f = DjangoS3UploadForm()
        else:
            f = None
        return self.main(request, self.template, {
            'master_id': master_id,
            'show_skip': (self.request.GET.get('show_skip', '') == '1'),
            'is_update': self.request.GET.get('is_update', '0'),
            'default_ingest_group': request.user.get_profile().default_ingest_group.name,
            'uuid': uuid.uuid4(),
            'remote_url': getattr(settings, 'MASTER_REMOTE_UPLOAD_URL', ''),
            'include_media_shuttle': include_media_shuttle,
            'remote_master_filename': remote_master_filename,
            'django_s3upload_form': f,
        })

    def post(self, request):
        from portal.plugins.gnm_masters.tasks import reserve_filename
        master_id = self.kwargs.get('master_id')
        self.master = vs_helpers.get_vsobject_or_404(VSMaster, master_id, request.user)
        remote_master_filename = request.POST.get('remote_master_filename', '')
        try:
            sgn = reserve_filename(self.master, remote_master_filename)
        except ValidationError as x:
            return HttpResponse(content=next(iter(x.messages)), content_type='text/html', status=409)
        return HttpResponse()

    def get_template(self, template_name):
        if self.master.get('gnm_master_upload_lock', '') == 'locked':
            return super(MasterIngestView, self).get_template('gnm_masters/master_locked.html')
        return super(MasterIngestView, self).get_template('gnm_masters/master_ingest.html')


class MasterSetJobIdView(GuardianBaseView):
    def post(self, request):
        jobid = request.POST.get('jobid')
        skip_edl = request.POST.get('skip_edl', 'false')
        if jobid is None:
            return HttpResponse(status=500)

        md = E.MetadataDocument(
            E.timespan(
                E.field(
                    E.name(const.GNM_JOB_ID),
                    E.value(jobid),
                ),
                E.field(
                    E.name(const.GNM_USER_SKIPPED_EDL_UPLOAD),
                    E.value(skip_edl),
                ), end='+INF', start='-INF'
            )
        )

        # Only update if: It is a new update AND it has already been published somewhere (status is "Ready to Publish", "Live" or equivalent)
        if request.GET.get('is_update', '') == '1':
            update_field = E.field(
                E.name(const.GNM_MASTERS_GENERIC_UPLOADTYPE),
                E.value('Update')
            )
            md.find(tag('timespan')).append(update_field)

        resp = vs_calls.put('item/{id}/metadata'.format(id=self.kwargs.get('master_id')), ET.tostring(md), request.user)
        if is_error(resp.status_code):
            raise_error(resp)

        return HttpResponse()


class UploadEDLDataView(APIView):
    parser_classes = (FileUploadParser,)
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )

    def post(self, request, master_id):
        from .edl_import import update_edl_data
        f = request.FILES['edl_file']

        update_edl_data(f, master_id, request.user)
        return Response('', status=204)


class MasterJobRetryView(GuardianBaseView):
    def post(self, request):
        jobid = request.POST.get('jobid')
        if jobid is None:
            return HttpResponse(status=500)

        resp = vs_calls.post('job/{id}/re-run'.format(id=jobid), '', request.user)
        if is_error(resp.status_code):
            raise_error(resp)

        doc = parse_xml(resp.content)
        new_job = doc.find(tag('jobId')).text

        md = E.MetadataDocument(
            E.timespan(
                E.field(
                    E.name(const.GNM_JOB_ID),
                    E.value(new_job)
                ), end='+INF', start='-INF'
            )
        )
        resp = vs_calls.put('item/{id}/metadata'.format(id=self.kwargs.get('master_id')), ET.tostring(md), request.user)
        if is_error(resp.status_code):
            raise_error(resp)

        return HttpResponse()


class MasterImportBaseView(GuardianBaseView):
    """
    Refactored common code for importing masters. Inherit from this view to implement an actual import
    Properties:
     - master_id = ID of the master in question
    """
    def __init__(self,*args,**kwargs):
        super(MasterImportBaseView,self).__init__(*args,**kwargs)
        self.master_id = None

    def get_filepath(self,request):
        """
        Returns the filepath URI for Vidispine to ingest.  Path components should be escaped but the URI itself should not,
        as per the Vidispine documentation
        :param request: Django request object passed in
        :return: URL string
        """
        return request.POST.get('filename')

    def get_jobmeta(self,request):
        """
        Returns extra job metadata as a string
        :param request: Django request object passed in
        :return: URL encoded job metadata string
        """
        from .utils import get_job_metadata
        return get_job_metadata(request.user)

    def post(self, request):
        """
        Main Post handler.  Calls the get_filepath and get_jobmetadata callbacks
        :param request: Django request
        :return: Django response
        """
        self.master_id = self.kwargs.get('master_id')

        filepath = self.get_filepath(request)

        jobmetadata = self.get_jobmeta(request)

        url = 'item/{id}/shape/essence?uri={uri}&jobmetadata={jobmetadata}&priority=HIGHEST'.format(
            id=self.master_id,
            uri=urllib.parse.quote(filepath, ''),
            jobmetadata=jobmetadata,
            )
        resp = vs_calls.post(url, '', request.user.username)
        if is_error(resp.status_code):
            log_vs_error_from_resp(resp)
            if resp.status_code == 404:
                return HttpResponse('File not found in dropfolder, please select a file from the dropfolder.', status=500)
            return HttpResponse('Import failed, vidispine returned {status}'.format(status=resp.status_code), status=500)

        jobid = get_jobid(xmlstring=resp.content)
        return HttpResponse(jobid)


class MasterImportViaFilename(MasterImportBaseView):
    """
    Refactored code to import a master from a filename on the SAN
    """
    def get_filepath(self, request):
        """
        Returns filepath for a file on the SAN
        :param request: Django request object
        :return: filepath string
        """
        filename = request.POST.get('filename')
        if filename is None:
            return HttpResponse('No filename specified', status=500)

        if not hasattr(settings, 'MASTER_IMPORT_STORAGE_VS_PATH'):
            return HttpResponse('MASTER_IMPORT_STORAGE_VS_PATH not configured', status=500)

        filepath = urllib.parse.quote(os.path.join(settings.MASTER_IMPORT_STORAGE_VS_PATH, filename), '/')
        return filepath


class MasterImportViaS3(MasterImportBaseView):
    """
    Import a master from a location on S3 (with a URL passed in by django-s3direct, which is an HTTP URL)
    """
    def get_filepath(self,request):
        """
        Converts an http(s) S3 URL passed from django-s3direct to an S3 URL and returns it to Vidispine.
        No checking is done on the URL beyond verifying that it has protocol, endpoint and path parts; so you should make
        sure that it is of the correct form
        :param request:
        :return:
        """
        import re
        #pprint(request.POST)
        unquoted = urllib.parse.unquote_plus(request.POST.get('fileurl'))
        parts = re.match(r'^(?P<proto>\w+)://(?P<endpoint>[^\/]+)/(?P<bucketpath>.*)',unquoted)
        log.debug("unquoted URL: {0}".format(unquoted))
        if parts is None:
            raise ValueError("{0} does not appear to be a valid URL (no protocol portion)".format(unquoted))
        quoted_path=urllib.parse.quote(parts.group('bucketpath'), '/')
        log.debug("quoted_path: {0}".format(quoted_path))
        return 's3://' + quoted_path


class MasterImportViaS3_portaldownload02(MasterImportBaseView):
    """
    Import a master from a location on S3, by downloading the data to local storage first
    """
    def get_filepath(self,request):
        from django.conf import settings
        from boto.s3 import connect_to_region
        import re

        conn = connect_to_region(settings.S3DIRECT_REGION,aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                 aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
        log.debug("Connected to S3")
        rawurl = request.POST.get('fileurl')
        rawurl = urllib.parse.unquote_plus(rawurl)
        log.debug("URL is {0}".format(rawurl))
        parts = re.match(r'^(?P<proto>\w+)://(?P<endpoint>[^\/]+)/(?P<bucket>[^\/]+)/(?P<bucketpath>.*)', rawurl)
        if parts is None:
            raise ValueError("{0} does not appear to be an S3 URL")

        log.debug("Accessing bucket {0}".format(parts.group('bucket')))
        bucket = conn.get_bucket(parts.group('bucket'))
        log.debug("Finding key {0}".format(parts.group('bucketpath')))
        k = bucket.get_key(parts.group('bucketpath'))
        # log.debug("Generating url for {0} in {1}".format(parts.group('bucketpath'), parts.group('bucket')))
        # url = k.generate_url(expires_in=1800, policy="authenticated-read")
        # log.debug("Got URL {0}".format(url))
        # return url
        log.debug("Getting file...")
        local_filename = os.path.join("/tmp",os.path.basename(parts.group('bucketpath')))
        k.get_contents_to_filename(local_filename)
        log.debug("Done")
        return urllib.parse.quote(local_filename, '/')


class MasterImportViaS3_portaldownload03(MasterImportBaseView):
    """
    Import a master from a location on S3, by generating a temporary URL to access the object
    """
    def get_filepath(self,request):
        from django.conf import settings
        from boto.s3 import connect_to_region
        import re

        conn = connect_to_region(settings.S3DIRECT_REGION,aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                                 aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY)
        log.debug("Connected to S3")
        rawurl = request.POST.get('fileurl')
        rawurl = urllib.parse.unquote_plus(rawurl)
        log.debug("URL is {0}".format(rawurl))
        parts = re.match(r'^(?P<proto>\w+)://(?P<endpoint>[^\/]+)/(?P<bucket>[^\/]+)/(?P<bucketpath>.*)', rawurl)
        if parts is None:
            raise ValueError("{0} does not appear to be an S3 URL")

        log.debug("Accessing bucket {0}".format(parts.group('bucket')))
        bucket = conn.get_bucket(parts.group('bucket'))
        log.debug("Finding key {0}".format(parts.group('bucketpath')))
        k = bucket.get_key(parts.group('bucketpath'))
        log.debug("Generating url for {0} in {1}".format(parts.group('bucketpath'), parts.group('bucket')))
        url = k.generate_url(expires_in=1800, policy="authenticated-read")
        log.debug("Got URL {0}".format(url))
        return url


class UpdateStatusMixin(object):
    class InvalidDataError(Exception):
        pass

    def update_status(self,status,fieldname,master_id,user):
        if status is None:
            raise self.InvalidDataError("MasterUpdateStatusView: no status parameter in request.POST")
        if fieldname is None:
            raise self.InvalidDataError("MasterUpdateStatusView: no fieldname parameter from url")
        if master_id is None:
            raise self.InvalidDataError("MasterUpdateStatusView: no master_id parameter from url")

        md = E.MetadataDocument(
            E.timespan(
                E.field(
                    E.name(fieldname),
                    E.value(status)
                ), end='+INF', start='-INF'
            )
        )

        resp = vs_calls.put('item/{id}/metadata'.format(id=master_id), ET.tostring(md), user)
        if is_error(resp.status_code):
            raise_error(resp)


class MasterUpdateStatusView(UpdateStatusMixin, GuardianBaseView):
    def post(self, request):
        from portal.plugins.gnm_misc_utils.helpers import inform_sentry_exception
        status = request.POST.get('status')
        fieldname = self.kwargs.get('fieldname')
        master_id = self.kwargs.get('master_id')

        try:
            self.update_status(status, fieldname, master_id, request.user)
        except self.InvalidDataError as e:
            inform_sentry_exception(str(e))
            return HttpResponse(str(e),mimetype='text/plain',status=400)
        except Exception as e:
            inform_sentry_exception("Unable to update master status",extra_ctx={'status': status, 'fieldname': 'fieldname'})


class MasterTrigger(UpdateStatusMixin, APIView):
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, XMLRenderer, YAMLRenderer, )

    def get_output_location_for(self,target,uploadtype):
        """
        Get the output location from system config for the given upload type and target
        :param target: target name, must be specified
        :param uploadtype: upload type, optional
        :return: tuple of (outputfolder, outputfield)
        """
        try:
            return (settings.TRIGGER_FOLDER_LOCATIONS[target][uploadtype]['path'],
                    settings.TRIGGER_FOLDER_LOCATIONS[target][uploadtype]['field'])
        except KeyError:
            return (settings.TRIGGER_FOLDER_LOCATIONS[target]['path'],
                    settings.TRIGGER_FOLDER_LOCATIONS[target]['field'])

    def post(self, request, master_id=None, target=None):
        from .mdexporter import item_information, export_metadata
        from portal.plugins.gnm_misc_utils.helpers import inform_sentry_exception
        import traceback

        if 'type' in request.GET:    #will be None if not set
            uploadtype = request.GET['type']
        else:
            uploadtype = None

        try:
            if target in list(settings.TRIGGER_FOLDER_LOCATIONS.keys()):
                outfolder, outfield = self.get_output_location_for(target, uploadtype)

            else:
                return Response({'status': 'error',
                         'detail': "The output trigger '{0}' is not known, check pluto_settings.py".format(target)
                         }, status=400)

            self.update_status("Ready to Upload", outfield, master_id,request.user)

            itemdata = item_information(master_id,['originalFilename'])
            outpath = export_metadata(master_id, outfolder, itemdata['originalFilename'][0], settings.TRIGGER_PROJECTION)

            return Response({'status': 'ok', 'detail': 'trigger output to {0}'.format(outfolder), 'output_path': outpath})
        except KeyError as e:
            inform_sentry("Outputting trigger file for {0} to {1}".format(master_id, outfolder))
            return Response({'status': 'error', 'detail': "Output target exists but not set up properly: {0}".format(target)},status=500)
        except Exception as e:
            inform_sentry_exception("Outputting trigger file for {0} to {1}".format(master_id, outfolder))
        return Response({'status': 'error', 'trace': traceback.format_exc(), 'error': str(e)}, status=500)


class SearchForMasterAPIView(APIView):
    renderer_classes = (JSONRenderer, )
    authentication_classes = (IsAuthenticated, )

    item_id_extractor = re.compile("^\w{2}-(\d+)$")

    def get(self, *args,**kwargs):
        from .vs_search import vs_master_search
        from .serializers import MasterSerializer
        request = args[0]

        try:
            fileName = request.GET["filename"]
        except KeyError:
            return Response({"status":"badrequest","detail":"You must include ?filename in the url"},status=400)

        try:
            vs_id_list = vs_master_search(fileName)
            numeric_id_list = [int(self.item_id_extractor.match(vsid).group(1)) for vsid in vs_id_list]
            retrieved_data = [x for x in MasterModel.objects.filter(pk__in=numeric_id_list)]

            ser = MasterSerializer(retrieved_data, many=True)
            return Response(ser.data)
        except Exception as e:
            inform_sentry("Master search failed",{"filename":fileName})
            return Response({"status":"error", "detail":str(e)}, status=500)