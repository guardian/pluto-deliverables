# coding: utf-8


import logging
import re
from collections import namedtuple
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.urls import reverse
from django.db.models import Q
from django.forms.models import modelformset_factory
from django.http import Http404
from django.shortcuts import redirect
from django.views.generic.detail import SingleObjectMixin
from django.views.generic import TemplateView
from rest_framework import mixins
from rest_framework.authentication import BasicAuthentication
from rest_framework.generics import GenericAPIView, RetrieveUpdateAPIView, RetrieveAPIView, ListAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework.status import HTTP_409_CONFLICT
from rest_framework.views import APIView
#from gnm_misc_utils.csrf_exempt_session_authentication import CsrfExemptSessionAuthentication
from gnm_vidispine_errors.exceptions import VSException
from .choices import DELIVERABLE_ASSET_TYPES, DELIVERABLE_ASSET_STATUS_NOT_INGESTED, DELIVERABLE_ASSET_STATUS_INGESTED, \
    DELIVERABLE_ASSET_STATUS_INGEST_FAILED, DELIVERABLE_ASSET_STATUS_INGESTING
from .exceptions import NoShapeError
from .forms import DeliverableCreateForm
from .models import Deliverable, DeliverableAsset
from .serializers import DeliverableAssetSerializer, DeliverableSerializer

logger = logging.getLogger(__name__)


def inform_sentry_exception(err):
    pass


class NewDeliverablesAPIList(ListAPIView):
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )
    serializer_class = DeliverableSerializer

    def get_queryset(self):
        ###FIXME: need to implement pagination, total count, etc.
        return Deliverable.objects.all()


class NewDeliverablesAPICreate(CreateAPIView):
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )
    parser_classes = (JSONParser, )
    serializer_class = DeliverableSerializer


class NewDeliverableAssetAPIList(ListAPIView):
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )
    serializer_class = DeliverableAssetSerializer

    def get_queryset(self):
        bundle_id = self.request.GET["project_id"]
        parent_bundle = Deliverable.objects.get(project_id=bundle_id)
        return DeliverableAsset.objects.filter(deliverable=parent_bundle)

    def get(self, *args, **kwargs):
        try:
            return super(NewDeliverableAssetAPIList,self).get(*args,**kwargs)
        except Deliverable.DoesNotExist:
            return Response({"status":"error", "detail": "Project not known"},status=404)
        except KeyError:
            return Response({"status":"error","detail": "you must specify a project_id= query param"},status=400)


class NewDeliverableAPIScan(APIView):
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )

    def post(self, request):
        try:
            bundle = Deliverable.objects.get(project_id=request.GET["project_id"])
            results = bundle.sync_assets_from_file_system()
            return Response({"status":"ok","detail":"resync performed", **results}, status=200)
        except Deliverable.DoesNotExist:
            return Response({"status":"error", "detail": "Project not known"},status=404)
        except Exception as e:
            return Response({"status":"error","detail":str(e)},status=500)


class ModelSearchAPIView(APIView):
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )

    def dispatch(self, request, *args, **kwargs):
        """
        simple catchall to ensure that exceptions are caught
        :param request:
        :param args:
        :param kwargs:
        :return:
        """
        try:
            return super(ModelSearchAPIView, self).dispatch(request,*args,**kwargs)
        except Exception as e:
            inform_sentry_exception("Not able to load ModelSearchApiView")
            raise

    def get(self, request):
        search = request.GET.get('sSearch', None)
        start = int(request.GET.get('iDisplayStart',0))
        count = int(request.GET.get('iDisplayLength',100))
        order_count = int(request.GET.get('iSortingCols', '0'))
        columns = self.columns()
        owner = request.GET.get('owner', None)
        search_string = request.GET.get('search_string', None)

        qs = self.objects()
        q = self.filter(request.user)
        if search:
            q2 = Q()
            for x in self.search_columns():
                q2 |= Q(**{(x + '__icontains'): search})
            q &= q2
        qs = qs.filter(q)
        order_by = []
        for x in range(order_count):
            try:
                sort_col = int(request.GET.get('iSortCol_%s' % x))
                col = columns[sort_col]
            except IndexError:
                col = None
            if not col:
                logger.warning('invalid sort column index %s' % sort_col)
                continue
            sign = '-' if request.GET.get('sSortDir_%s' % x, None) == 'desc' else ''
            order_by.append(sign + col)
        if order_by:
            qs = qs.order_by(*order_by)
        if owner == None:
            qs = qs.all()
        elif search_string == 'gnm_commission_owner__username__icontains':
            qs = qs.all().filter(gnm_commission_owner__username__icontains=owner)
        elif search_string == 'gnm_project_username__username__icontains':
            qs = qs.all().filter(gnm_project_username__username__icontains=owner)
        elif search_string == 'user__username__icontains':
            qs = qs.all().filter(user__username__icontains=owner)
        hits = len(qs)
        qs = self.prepare_data(qs[start:start + count], hits)
        return Response({'aaData': qs, 'sEcho': int(request.GET.get('sEcho', 0)), 'iTotalDisplayRecords': hits, 'iTotalRecords': hits})

    def objects(self):
        # e.g. MasterModel.objects
        raise Exception('This method must be overridden')

    def columns(self):
        # columns returned to datatable
        return []

    def search_columns(self):
        # columns to perform full text search in
        return []

    def filter(self, user):
        # the entire query must match
        return Q()

    def prepare_data(self, data, hits):
        # return a list of lists of column data
        raise Exception('This method must be overridden')

    @staticmethod
    def dateformat(date):
        return date.strftime('%d/%m/%Y %I:%M %p') if date else ''


class DeliverablesListView(TemplateView):
    template_name = "gnm_deliverables/deliverables.html"

    def get_context_data(self, **kwargs):
        ###FIXME: replace with a REST call to pluto-core
        return {
            "title": "Deliverable Bundles",
            "working_groups": []
        }


class DeliverablesSearchForWorkingGroupAPIView(ModelSearchAPIView):
    def objects(self):
        return Deliverable.objects

    def columns(self):
        return 'name id'.split()

    def search_columns(self):
        return 'name id'.split()

    def prepare_data(self, data, hits):
        return [self.item(x) for x in data]

    def item(self, deliverable):
        return [
            None,
            deliverable.assets.count(),
            ModelSearchAPIView.dateformat(deliverable.created),
            deliverable.status(),
            deliverable.id,
            deliverable.name,
            deliverable.project_id
        ]

    def get(self, request, working_group=None):
        self.mine_only = "mine" in request.GET
        self.working_group = working_group
        return super(DeliverablesSearchForWorkingGroupAPIView, self).get(request)

    def filter(self, user):
        rtn = Q()

        if self.working_group is not None:
            rtn = rtn & Q(parent_project__commission__gnm_commission_workinggroup=self.working_group)
        if self.mine_only:
            rtn = rtn & Q(parent_project__gnm_project_username=self.request.user.pk)
        return rtn


class DeliverablesSearchAPIView(ModelSearchAPIView):
    def objects(self):
        return Deliverable.objects

    def columns(self):
        return 'name id'.split()

    def search_columns(self):
        return 'name id'.split()

    def prepare_data(self, data, hits):
        return [self.item(x) for x in data]

    def item(self, deliverable):
        return [
            None,
            deliverable.assets.count(),
            ModelSearchAPIView.dateformat(deliverable.created),
            deliverable.status(),
            deliverable.id,
            deliverable.name,
            deliverable.project_id
        ]

    def get(self, request, project_id=None):
        self.mine_only = "mine" in request.GET
        self.project_id = project_id
        return super(DeliverablesSearchAPIView, self).get(request)

    def filter(self, user):
        rtn = Q()

        if self.project_id is not None:
            rtn = rtn & Q(project_id=self.project_id)
        if self.mine_only:
            rtn = rtn & Q(parent_project__gnm_project_username=self.request.user)
        return rtn


class DeliverablesBaseView(TemplateView):
    title = ''
    template_name = 'gnm_deliverables/deliverables.html'

    def get_project(self):
        logger.warning("get_project not implemented yet")
        return None

    def get_context_data(self, **kwargs):
        from django.conf import settings

        return dict(
            DEBUG=str(settings.DEBUG).lower(),
            title=self.get_title(),
            project=self.get_project(),
            DELIVERABLE_ASSET_STATUS_NOT_INGESTED=DELIVERABLE_ASSET_STATUS_NOT_INGESTED,
            DELIVERABLE_ASSET_STATUS_INGESTED=DELIVERABLE_ASSET_STATUS_INGESTED,
            DELIVERABLE_ASSET_STATUS_INGESTING=DELIVERABLE_ASSET_STATUS_INGESTING,
            DELIVERABLE_ASSET_STATUS_INGEST_FAILED=DELIVERABLE_ASSET_STATUS_INGEST_FAILED
        )


class DeliverableCreateView(DeliverablesBaseView):
    title = 'Create new deliverable'
    template_name = 'gnm_deliverables/deliverables_create.html'

    def get_form(self):
        if self.request.method == 'POST':
            return DeliverableCreateForm(self.request.POST)
        else:
            return DeliverableCreateForm(initial={'name': "not set"})

    def get_context_data(self, **kwargs):
        from django.conf import settings
        context = super(DeliverableCreateView, self).get_context_data()
        context['form'] = self.get_form()
        context['SAN_ROOT'] = getattr(settings, 'GNM_DELIVERABLES_SAN_ROOT', '/tmp')
        return context

    def post(self, request):
        extra_context = self.get_extra_context_data()
        form = extra_context['form']
        project = extra_context['project']
        num_deliverables = Deliverable.objects.filter(project_id=project.id).count()
        if num_deliverables != 0:
            messages.error(request, 'There is already one or more deliverables for this project.')
            return self.main(request, self.template, extra_context=extra_context)
        if form.is_valid():
            instance = form.save(commit=False)
            try:
                path, created = instance.create_folder()
                if created and path:
                    messages.info(request, 'Created folder for deliverable at: {path}'.format(path=path))
                    instance.project_id = project.id
                    instance.save()
                    return redirect('deliverables_detail', instance.pk)
                elif not created and path:
                    messages.error(request, 'The folder already existed for deliverable at: {path}'.format(path=path))
                else:
                    messages.error(request, 'Failed to create folder for deliverable at: {path}'.format(path=path))
            except OSError as e:
                messages.error(request, 'Failed to create folder for {name}: {e}'.format(name=instance, e=e.strerror))
        return self.main(request, self.template, extra_context=extra_context)


class DeliverableDetailView(DeliverablesBaseView, SingleObjectMixin):
    template_name = 'gnm_deliverables/deliverables_detail.html'
    model = Deliverable

    def get_formset(self):
        DeliverableAssetFormSet = modelformset_factory(
            DeliverableAsset, fields='type'.split(), extra=0, can_delete=True, can_order=False
        )
        return DeliverableAssetFormSet(
            queryset=self.object.assets.all(),
            data=self.request.POST if self.request.method == 'POST' else None
        )

    def get_extra_context_data(self):
        import os

        context = super(DeliverableDetailView, self).get_extra_context_data()
        self.object = self.get_object()
        user = self.request.user
        deliverable = Deliverable.objects.get(pk=self.kwargs.get('pk'))
        deliverable.sync_assets_from_file_system()
        formset = self.get_formset()
        context['folder_exists'] = os.path.exists(deliverable.path)
        for form in formset:
            form.instance.version = form.instance.version(user)
            form.instance.duration = form.instance.duration(user)
            form.instance.status_string = form.instance.status_string(user)
            form.instance.status = form.instance.status(user)

        context['local_path'] = deliverable.local_path
        context['local_open_uri'] = deliverable.local_open_uri

        context['formset'] = formset
        context['deliverable'] = deliverable
        context['type_choices'] = DELIVERABLE_ASSET_TYPES
        context['title'] = deliverable.name
        context['assets_with_ongoing_jobs'] = [d.id for d in formset.queryset if d.has_ongoing_job(user)]

        return context

    def post(self, request):
        self.object = self.get_object()
        user = self.request.user
        formset = self.get_formset()
        assets = [form.instance for form in formset.deleted_forms]
        if 'action_delete' in self.request.POST:
            for asset in assets:
                asset.purge(user=user)
            return redirect(reverse('deliverables_detail', args=(self.object.id,)))
        if 'action_add_asset' in self.request.POST:
            add_asset_url = self.request.POST.get('add_asset_url', None)
            logger.info('Adding asset from url: "{url}"'.format(url=add_asset_url))
            matches = re.search('{site_id}-\d+'.format(site_id=vs_helpers.site_id), add_asset_url)
            if matches is not None:
                item_id = matches.group(0)
                try:
                    asset, created = self.object.create_asset_from_vs_item(item_id, user)
                    if not created:
                        messages.info(request, '{asset} already exists in this deliverable'.format(asset=asset))
                except NoShapeError as e:
                    messages.info(request, 'Failed to add item {item_id}: Missing file, no file ingested?'.format(item_id=item_id))
            return redirect(reverse('deliverables_detail', args=(self.object.id,)))
        retry_number = 1

        while retry_number <= int(self.request.POST.get("loop_number")):
            if 'action_retry{0}'.format(retry_number) in self.request.POST:
                asset_object = DeliverableAsset.objects.get(pk=self.request.POST.get("retry_id{0}".format(retry_number)))
                asset_object.purge(user=user)
                self.object.create_asset_from_vs_item(self.request.POST.get("retry_item{0}".format(retry_number)), user)
                messages.info(request, 'Retrying creating asset from Vidispine item {0}'.format(self.request.POST.get("retry_item{0}".format(retry_number))))
                return redirect(reverse('deliverables_detail', args=(self.object.id,)))
            retry_number = retry_number + 1
        raise Http404()


class DeliverableAssetCheckTypeChange(mixins.RetrieveModelMixin, GenericAPIView):
    """
    Called before DeliverableAssetUpdateAPIView in order to check if the type change will be a conflict
    """
    authentication_classes = (BasicAuthentication,)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    serializer_class = DeliverableAssetSerializer
    model = DeliverableAsset

    def post(self, request, *args, **kwargs):
        response = self.retrieve(request)  # This sets self.object
        type = request.DATA.get('type', None)
        existing_asset = self.object.deliverable.asset_type(type)
        
        if existing_asset is None or existing_asset.type_allows_many():
            return response

        return Response(status=HTTP_409_CONFLICT)


class DeliverableAssetUpdateAPIView(RetrieveUpdateAPIView):
    """
    API view called on type change on the details page
    """
    serializer_class = DeliverableAssetSerializer
    authentication_classes = (BasicAuthentication,)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    model = DeliverableAsset

    def pre_save(self, obj):
        from gnm_asset_folder.tasks import FolderCreationFailed
        super(DeliverableAssetUpdateAPIView, self).pre_save(obj)
        original = self.get_object_or_none()
        logger.info('Current asset type: %s' % original.type)
        # if original.type is not None:
            # raise ValidationError(dict(
            #     type=['This asset type is already locked']
            # ))

        # Check if we need to override asset
        self.asset_to_override = obj.deliverable.asset_type(obj.type)
        if self.asset_to_override is not None and not obj.type_allows_many():
            if obj.item_id is None and not self.asset_to_override.created_from_existing_item:
                obj.item_id = self.asset_to_override.item_id  # Copy item id from the asset this one replaces
                obj.job_id = None  # Force new import job
                self.asset_to_override.delete()
            else:
                self.asset_to_override.type = None
                self.asset_to_override.save()

        # Create placeholder item if not exists
        user = self.request.user

        try:
            obj.create_placeholder(user, commit=False)
        except VSException as e:
            raise ValidationError(dict(
                type=['Failed to create placeholder item: {e}'.format(e=e)]
            ))

        # Start import job if job_id is not set
        try:
            obj.start_file_import(user, commit=False)
        except VSException as e:
            raise ValidationError(dict(
                type=['Failed to start import job: {e}'.format(e=e)]
            ))
        except FolderCreationFailed as e:
            raise ValidationError(dict(
                type=['Failed to create folder for deliverables: {e}'.format(e=e)]
            ))

    def post_save(self, obj, created=False):
        if not created:
            obj.update_metadata(self.request.user)
        return super(DeliverableAssetUpdateAPIView, self).post_save(obj)


class NaughtyListUIView(TemplateView):
    template_name = 'gnm_deliverables/naughtylist.html'


class NaughtyListAPIView(APIView):
    """
    Return a JSON showing projects that don't have any deliverables attached
    """
    renderer_classes = (JSONRenderer, )
    permission_classes = (IsAuthenticated, )

    def get(self, request):
        from datetime import datetime
        from gnm_projects.models import ProjectModel
        from gnm_vidispine_utils.vs_helpers import site_id
        import dateutil.parser

        if not 'since' in request.GET:
            return Response({"status":"error","detail": "You must specify since= to limit the number of projects checked"},status=400)
        if 'until' in request.GET:
            try:
                until = dateutil.parser.parse(request.GET['until'])
            except Exception as e:
                return Response({"status":"error","detail": "{0} is not a valid timestamp".format(request.GET['until']), "exception": str(e)},status=400)
        else:
            until = datetime.now()

        try:
            since = dateutil.parser.parse(request.GET['since'])
        except Exception as e:
            return Response({"status":"error","detail": "{0} is not a valid timestamp".format(request.GET['since']), "exception": str(e)},status=400)

        queryset = ProjectModel.objects.filter(updated__gte=since,updated__lte=until).exclude(gnm_project_status="New").exclude(gnm_project_status="Killed")

        limited = False
        total = queryset.count()
        if total > 100:
            queryset = queryset[0:100]
            limited = True

        projectid_list = ["{0}-{1}".format(site_id, x['collection_id']) for x in queryset.values('collection_id')]

        logger.debug("Projects created since {0}: {1}".format(since.isoformat(), projectid_list))

        deliverables_counts = [(id, Deliverable.objects.filter(project_id=id).count()) for id in projectid_list]
        no_deliverables = [tpl[0] for tpl in [tpl for tpl in deliverables_counts if tpl[1]==0]]
        return Response({"status":"ok","projects":no_deliverables,"limited": limited,"total": total}, status=200)


class DeliverableCreateFolderView(APIView):
    renderer_classes = (JSONRenderer,)
    permission_classes = (IsAuthenticated, )

    def get(self, request, pk=None):
        from .files import create_folder
        import os

        try:
            deliverable = Deliverable.objects.get(pk=self.kwargs.get('pk'))
            if not os.path.exists(deliverable.path):
                logger.info('Attempting to create folder: {0}'.format(deliverable.path))
                create_folder(deliverable.path)
                return Response({'status': 'ok'})
            inform_sentry_exception("Folder already exists.")
            return Response({'status': 'error', 'detail': 'Folder already exists'}, status=409)
        except Deliverable.DoesNotExist as e:
            inform_sentry_exception("The deliverable object does not exist.")
            logger.error('The deliverable object does not exist: {0}'.format(e))
            return Response({'status': 'error', 'detail': 'The deliverable object does not exist'}, status=404)
        except OSError as e:
            inform_sentry_exception("Could not re-create deliverables folder.")
            logger.error('An operating system error occurred: {0}'.format(e))
            return Response({'status': 'error', 'detail': 'An operating system error occurred'}, status=500)
        except Exception as e:
            inform_sentry_exception("Create folder failed.")
            logger.error('Create folder failed: {0}'.format(e))
            return Response({'status': 'error', 'detail': 'Could not create the folder'}, status=500)


class SearchForDeliverableAPIView(RetrieveAPIView):
    """
    see if we have any deliverable assets with the given file name. This is used for tagging during the backup process.
    """
    renderer_classes = (JSONRenderer, )
    authentication_classes = (IsAuthenticated, )
    serializer_class = DeliverableAssetSerializer

    def get_object(self, queryset=None):
        fileName = self.request.GET["filename"]
        return DeliverableAsset.objects.filter(filename=fileName)[0]

    def get(self, request, *args, **kwargs):
        from gnm_misc_utils.helpers import inform_sentry_exception
        try:
            return super(SearchForDeliverableAPIView, self).get(request,*args,**kwargs)
        except KeyError:
            return Response({"status":"badrequest","detail":"You must include ?filename in the url"},status=400)
        except IndexError:
            return Response({"status":"notfound","detail":"No deliverables found with the filename {0}".format(self.request.GET["filename"])}, status=404)
        except Exception as e:
            logger.exception("Could not look up deliverables for filename {0}:".format(self.request.GET["filename"]), e)
            inform_sentry_exception("Could not look up deliverables for filename {0}:".format(self.request.GET["filename"]))
            return Response({"status":"error","detail":str(e)}, status=500)


class DeliverableAPIRetrieveView(RetrieveAPIView):
    """
    retrieve the deliverable associated with this address
    """
    from .serializers import DeliverableSerializer
    renderer_classes = (JSONRenderer, )
    authentication_classes = (IsAuthenticated, )
    serializer_class = DeliverableSerializer
    model = Deliverable