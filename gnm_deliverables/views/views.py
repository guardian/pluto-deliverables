# coding: utf-8

import functools  # for reduce()
import logging
import re
import urllib.parse
import urllib.parse
import os
from rabbitmq.time_funcs import get_current_time
from django.conf import settings
from django.views.generic import TemplateView
from gnmvidispine.vidispine_api import VSNotFound, VSException, VSApi
from rest_framework import mixins, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.generics import RetrieveAPIView, \
    ListAPIView, CreateAPIView
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
import gnm_deliverables.launch_detector
from jsonschema import ValidationError
from gnm_deliverables.models import *
from gnm_deliverables.choices import DELIVERABLE_ASSET_TYPES, \
    DELIVERABLE_ASSET_STATUS_NOT_INGESTED, \
    DELIVERABLE_ASSET_STATUS_INGESTED, \
    DELIVERABLE_ASSET_STATUS_INGEST_FAILED, DELIVERABLE_ASSET_STATUS_INGESTING, \
    DELIVERABLE_ASSET_STATUS_TRANSCODED, \
    DELIVERABLE_ASSET_STATUS_TRANSCODE_FAILED, DELIVERABLE_ASSET_STATUS_TRANSCODING
from gnm_deliverables.exceptions import NoShapeError
from gnm_deliverables.files import create_folder_for_deliverable
from gnm_deliverables.jwt_auth_backend import JwtRestAuth
from gnm_deliverables.hmac_auth_backend import HmacRestAuth
from gnm_deliverables.models import Deliverable, DeliverableAsset, YouTubeCategories, YouTubeChannels
from gnm_deliverables.serializers import DeliverableAssetSerializer, DeliverableSerializer, DenormalisedAssetSerializer, SearchRequestSerializer
from gnm_deliverables.vs_notification import VSNotification
from datetime import datetime, timedelta
from django.db.models import Count
import copy

logger = logging.getLogger(__name__)


def inform_sentry_exception(err):
    pass


class NewDeliverableUI(TemplateView):
    template_name = "gnm_deliverables/new_ui.html"

    def get_context_data(self, **kwargs):
        full_url = settings.__getattr__("DEPLOYMENT_ROOT")
        parts = urllib.parse.urlparse(full_url)

        cbVersion = "DEV"
        try:
            from gnm_deliverables.version import version_branch, version_commit
            cbVersion = version_commit
        except Exception as e:
            logger.exception("Could not get version from source: ")

        return {
            "deployment_root": parts.path,
            "cbVersion": cbVersion,
            "vidispine_client_uri": settings.VIDISPINE_CLIENT_URI,
            "media_atom_uri": settings.MEDIA_ATOM_TOOL_URI,
            "archive_hunter_url": settings.ARCHIVE_HUNTER_URL
        }


class NewDeliverablesAPIList(ListAPIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    serializer_class = DeliverableSerializer

    def get_queryset(self):
        try:
            if "pageSize" in self.request.GET:
                page_size = int(self.request.GET["pageSize"])
            else:
                page_size = 50

            if "p" in self.request.GET:
                start_at = int(self.request.GET["p"]) * page_size   #page 1 is at index 0
            else:
                start_at = 0

            sort_by = 'created'
            if "sortBy" in self.request.GET:
                sort_by = self.request.GET["sortBy"]

            sort_order = '-'
            if "sortOrder" in self.request.GET:
                if self.request.GET["sortOrder"] == 'asc':
                    sort_order = ''

            return Deliverable.objects.all().order_by('{0}{1}'.format(sort_order, sort_by))[start_at:start_at+page_size]
        except ValueError:
            return Response({"status":"error","detail":"either pageSize or page was incorrectly formatted"}, status=400)
        except Exception as e:
            logger.exception("could not load bundle data: ", e)
            return Response({"status":"error","detail":str(e)},status=500)


class NewDeliverabesApiBundleGet(RetrieveAPIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    queryset = Deliverable.objects
    serializer_class = DeliverableSerializer
    lookup_url_kwarg = "bundleId"

class NewDeliverablesApiGet(RetrieveAPIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    queryset = Deliverable.objects
    serializer_class = DeliverableSerializer
    lookup_url_kwarg = "projectId"
    lookup_field = "pluto_core_project_id"


class NewDeliverablesAPICreate(CreateAPIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)
    serializer_class = DeliverableSerializer

    def attempt_create_bundle(self, bundle, auto_name, attempt_number, request):
        """
        Function to attempt to create a bundle.
        :param bundle: DeliverableSerializer object.
        :param auto_name: Boolean indicating if auto naming should be attempted if there is a problem with the name.
        :param attempt_number: Number of attempts.
        :param request: request object.
        :return: a Response object indicating the outcome of the attempt.
        """
        if attempt_number > 200:
            return Response({"status": "conflict", "field": "name", "detail": "This field must be a unique value. Two hundred attempts where made at automatically setting a unique value for it."}, status=409)

        if not bundle.is_valid():
            for field, error_details in bundle.errors.items():
                uniqueness_errors = list(filter(lambda entry: entry.code == 'unique', error_details))
                if (len(uniqueness_errors) > 0) and (field == "name") and auto_name:
                    data_to_set = copy.copy(request.data)
                    new_name = "{0}{1}".format(request.data["name"], attempt_number)
                    data_to_set["name"] = new_name
                    logger.debug('About to attempt to create a bundle with the name: {0}'.format(new_name))
                    new_bundle = DeliverableSerializer(data=data_to_set)
                    return self.attempt_create_bundle(new_bundle, auto_name, attempt_number + 1, request)
                if len(uniqueness_errors) > 0:
                    return Response({"status": "conflict", "field": field, "detail": "This field must be a unique value"}, status=409)
            return Response({"status": "error", "detail": str(bundle.errors)}, status=400)
        # If we get here then the request is definitely valid so proceed.
        name = bundle.validated_data['name']
        try:
            path, created = create_folder_for_deliverable(name)
            if created and path:
                logger.info('Created folder for deliverable at: %s', path)
                bundle.save()
                return Response({"status": "ok", "data": bundle.data}, status=200)
            elif not created and path:
                logger.error('The folder already exists for deliverable at: %s', path)
                bundle.save()
                return Response({"status": "ok", "data": bundle.data}, status=200)
            else:
                logger.error('Failed to create folder for deliverable at:  %s', path)
                return Response({"status": "error", "data": bundle.data}, status=409)
        except OSError as e:
            logger.error('Failed to create folder for {name}: {e}'.format(name=name, e=e.strerror))
            return Response({"status": "error", "data": e.strerror}, status=500)

    def post(self, request, *args, **kwargs):
        bundle = DeliverableSerializer(data=request.data)
        auto_name = self.request.GET.get("autoname", "false").lower() in ["true", "t", "yes", "1"]
        return self.attempt_create_bundle(bundle, auto_name, 1, request)


class NewDeliverableAssetAPIList(ListAPIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    serializer_class = DeliverableAssetSerializer

    def get_queryset(self):
        sort_by = 'filename'
        if "sortBy" in self.request.GET:
            sort_by = self.request.GET["sortBy"]

        sort_order = '-'
        if "sortOrder" in self.request.GET:
            if self.request.GET["sortOrder"] == 'asc':
                sort_order = ''

        bundle_id = self.request.GET["project_id"]
        parent_bundle = Deliverable.objects.get(pluto_core_project_id=bundle_id)
        return DeliverableAsset.objects.filter(deliverable=parent_bundle).order_by('{0}{1}'.format(sort_order, sort_by))

    def get(self, *args, **kwargs):
        try:
            return super(NewDeliverableAssetAPIList, self).get(*args, **kwargs)
        except Deliverable.DoesNotExist:
            return Response({"status": "error", "detail": "Project not known"}, status=404)
        except KeyError:
            return Response(
                {"status": "error", "detail": "you must specify a project_id= query param"},
                status=400)


class DeliverableAPIView(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def delete(self, *args, **kwargs):
        bundle_id = self.request.GET["project_id"]
        parent_bundle = Deliverable.objects.get(pluto_core_project_id=bundle_id)
        deliverables = DeliverableAsset.objects.filter(deliverable=parent_bundle,
                                                       pk__in=self.request.data)

        for asset in deliverables:
            try:
                if os.path.exists(str(asset.absolute_path)):
                    asset.remove_file()
                #asset.purge(user=self.request.user.get_username())
                asset.purge()
                asset.delete()
            except Exception as e:
                logger.error("Could not delete existing path or asset for asset {0}: {1}".format(str(asset), str(e)))

        return Response(status=status.HTTP_204_NO_CONTENT)


class CountDeliverablesView(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def get(self, *args, **kwargs):
        bundle_id = self.kwargs["project_id"]
        try:
            parent_bundle = Deliverable.objects.get(pluto_core_project_id=bundle_id)
            deliverables_count = DeliverableAsset.objects.filter(deliverable=parent_bundle, ).count()
            not_started = DeliverableAsset.objects.filter(deliverable=parent_bundle, status=DELIVERABLE_ASSET_STATUS_NOT_INGESTED).count()
            ingest_failed = DeliverableAsset.objects.filter(deliverable=parent_bundle, status=DELIVERABLE_ASSET_STATUS_INGEST_FAILED).count()
            transcode_failed = DeliverableAsset.objects.filter(deliverable=parent_bundle, status=DELIVERABLE_ASSET_STATUS_TRANSCODE_FAILED).count()
            unimported_count = not_started + ingest_failed + transcode_failed

            result = {'total_asset_count': deliverables_count,
                      'unimported_asset_count': unimported_count}

            return Response(result, status=200)
        except Deliverable.DoesNotExist:
            return Response({"status":"notfound","detail":"Deliverable bundle does not exist"}, status=404)


class NewDeliverableAPIScan(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)

    def post(self, request):
        try:
            bundle = Deliverable.objects.get(pluto_core_project_id=request.GET["project_id"])
            results = bundle.sync_assets_from_file_system()
            return Response({"status": "ok", "detail": "resync performed", **results}, status=200)
        except Deliverable.DoesNotExist:
            return Response({"status": "error", "detail": "Project not known"}, status=404)
        except Exception as e:
            return Response({"status": "error", "detail": str(e)}, status=500)


class DeliverablesTypeListAPI(APIView):
    """
    returns a json object of the available categories.
    this is in the format of:
    {
    "section": [ [id,name], [id,name], ... ],
    "section": [ [id,name], [id,name], ... ],
    }
    """
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)

    def get(self, request):
        result = functools.reduce(lambda acc, cat: {**acc, **{cat[0]: cat[1]}},
                                  DeliverableAsset.type.field.choices, {})
        return Response(result, status=200)


class AdoptExistingVidispineItemView(APIView):
    """
    tries to adopt the given vidispine item into the bundle list.
    """
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)

    vs_validator = re.compile(r'^\w{2}-\d+$')

    def post(self, request):
        project_id = request.GET.get("project_id")
        vs_id = request.GET.get("vs_id")
        if project_id is None or vs_id is None:
            return Response({"status": "error", "detail": "missing either project_id or vs_id"},
                            status=400)

        if not self.vs_validator.match(vs_id):
            return Response({"status": "error", "detail": "vidispine id is invalid"}, status=400)
        try:
            # FIXME: once bearer token auth is integrated, then the user= field must be set in create_asset_from_vs_item
            bundle = Deliverable.objects.get(pluto_core_project_id=project_id)
            asset, created = bundle.create_asset_from_vs_item(vs_id, user="admin")
            if created:
                return Response({"status": "ok", "detail": "item attached"}, status=200)
            else:
                return Response(
                    {"status": "conflict", "detail": "item is already attached to this bundle!"},
                    status=409)
        except Deliverable.DoesNotExist:
            return Response({"status": "notfound", "detail": "that deliverable does not exist"},
                            status=404)
        except NoShapeError:
            return Response({"status": "error", "detail": "the given item has no media"},
                            status=400)
        except VSNotFound:
            return Response(
                {"status": "notfound", "detail": "that item does not exist in Vidispine"},
                status=404)
        except VSException as e:
            logger.exception(
                "Could not communicate with VS adopting item {0}: {1}".format(vs_id, str(e)))
            return Response({"status": "server_error", "detail": str(e)})
        except Exception as e:
            logger.exception("Unexpected error adopting VS item {0}: ".format(vs_id))
            return Response({"status": "server_error", "detail": str(e)})


class SetTypeView(APIView):
    """
    set the deliverable type of the item and  possibly trigger ingest
    """
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def put(self, request, bundleId, assetId):
        try:
            item = DeliverableAsset.objects.get(id=assetId)
        except DeliverableAsset.DoesNotExist:
            return Response({"status": "notfound", "detail": "No such item exists"}, status=404)

        if item.deliverable.pluto_core_project_id != bundleId:
            return Response({"status": "notfound", "detail": "No such item exists"}, status=404)

        if "type" not in request.data:
            return Response({"status": "error", "detail": "No type field in body"}, status=400)
        if not isinstance(request.data["type"], int):
            return Response({"status": "error", "detail": "Type must be an integer identifier"},
                            status=400)

        try:
            item.type = request.data["type"]
            if item.online_item_id is None:
                logger.info("user object is {0}".format(request.user.__dict__))
                logger.info("username is {0}".format(request.user.get_username()))
                item.start_file_import(user=request.user.get_username())
            else:
                item.save()
            return Response(status=201)
        except Exception as e:
            logger.exception("Could not update item type: ", exc_info=e)
            return Response({"status": "server_error", "detail": str(e)}, status=500)


class TestCreateProxyView(APIView):
    authentication_classes = (JwtRestAuth, BasicAuthentication,)
    permission_classes = (IsAuthenticated,)

    def post(self, request, bundleId, assetId):
        try:
            item = DeliverableAsset.objects.get(id=assetId)
        except DeliverableAsset.DoesNotExist:
            return Response({"status": "notfound", "detail": "No such item exists"}, status=404)

        try:
            job_id = item.create_proxy()
            if job_id is None:
                return Response({"status": "not_needed", "detail": "A proxy already exists"},
                                status=409)
            else:
                return Response({"status": "ok", "job_id": job_id}, status=200)
        except Exception as e:
            logger.exception("Could not create proxy for asset id {0}: ".format(assetId),
                             exc_info=e)
            return Response({"status": "error", "detail": str(e)}, status=500)


class GetAssetView(RetrieveAPIView):
    authentication_classes = (JwtRestAuth, )
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )
    queryset = DeliverableAsset.objects.all()
    serializer_class = DenormalisedAssetSerializer



class DeliverableAPIStarted(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def get(self, *args, **kwargs):
        project_id = self.request.GET["project_id"]
        try:
            parent_bundle = Deliverable.objects.get(pluto_core_project_id=project_id)

            if parent_bundle.assets.filter(status=DELIVERABLE_ASSET_STATUS_NOT_INGESTED).exists():
                result = {'ingests_started': False}
            else:
                result = {'ingests_started': True}
            return Response(result, status=200)
        except Deliverable.DoesNotExist:
            return Response({"status": "error", "detail": "Bundle not known"}, status=404)
        except KeyError:
            return Response({"status": "error", "detail": "You must specify a bundleId= query parameter"}, status=400)


class LaunchDetectorUpdateView(APIView):
    authentication_classes = (HmacRestAuth, )
    permission_classes = (IsAuthenticated, )
    parser_classes = (JSONParser, )
    renderer_classes = (JSONRenderer, )

    def post(self, request, atom_id=None):
        from time import sleep
        logger.info("Received update from launch detector: {0}".format(request.data))
        try:
            msg = gnm_deliverables.launch_detector.LaunchDetectorUpdate(request.data)
        except ValidationError as e:
            logger.error("External update didn't validate: {0}".format(str(e)))
            logger.error("Offending content was: {0}".format(request.data))
            return Response({"status":"invalid_data"}, status=400)

        if msg.atom_id=="":
            logger.error("Received empty body")
            return Response({"status":"invalid_data"},status=400)
        attempt = 1
        while True:
            try:
                return self.try_update(request, msg)
            except DeliverableAsset.DoesNotExist:
                logger.error("Could not find a deliverable asset matching the atom id {0}".format(msg.atom_id))
                if attempt>=5:
                    return Response({"status":"not_found","atom_id":msg.atom_id}, status=404)
                else:
                    attempt+=1
                    #asynchronous retries would be a LOT better. But would be a lot more work too. We'll
                    #re-visit if this causes problems.  Max delay is 15s.
                    logger.warning("Retrying for attempt {} after 3s...".format(attempt))
                    sleep(3)
            except Exception as e:
                logger.exception("Could not process incoming update for {0}: ".format(atom_id), exc_info=e)
                return Response({"status":"server_error", "detail": str(e)}, status=500)

    def try_update(self, request, msg):
        asset = gnm_deliverables.launch_detector.find_asset_for(msg)

        logger.info("Found asset ID {} for {}".format(asset.pk, asset.atom_id))
        gnm_deliverables.launch_detector.update_gnmwebsite(msg, asset)
        gnm_deliverables.launch_detector.update_dailymotion(msg, asset)
        gnm_deliverables.launch_detector.update_mainstream(msg, asset)
        gnm_deliverables.launch_detector.update_youtube(msg, asset)
        asset.save()
        return Response({"status":"ok", "detail":"updated","atom_id":msg.atom_id}, status=200)


class SearchForDeliverableAPIView(RetrieveAPIView):
    """
    see if we have any deliverable assets with the given file name. This is used for tagging during the backup process.
    """
    renderer_classes = (JSONRenderer, )
    authentication_classes = (JwtRestAuth, HmacRestAuth, BasicAuthentication)
    permission_classes = (IsAuthenticated, )
    serializer_class = DenormalisedAssetSerializer

    def get_object(self, queryset=None):
        fileName = self.request.GET["filename"]
        return DeliverableAsset.objects.filter(filename=fileName)[0]

    def get(self, request, *args, **kwargs):
        try:
            return super(SearchForDeliverableAPIView, self).get(request,*args,**kwargs)
        except KeyError:
            return Response({"status":"badrequest","detail":"You must include ?filename in the url"},status=400)
        except IndexError:
            return Response({"status":"notfound","detail":"No deliverables found with the filename {0}".format(self.request.GET["filename"])}, status=404)
        except Exception as e:
            logger.exception("Could not look up deliverables for filename {0}:".format(self.request.GET["filename"]), e)
            return Response({"status":"error","detail":str(e)}, status=500)


class GenericAssetSearchAPI(ListAPIView):
    renderer_classes = (JSONRenderer, )
    parser_classes = (JSONParser, )
    authentication_classes = (JwtRestAuth, HmacRestAuth, BasicAuthentication)
    permission_classes = (IsAuthenticated, )
    serializer_class = DeliverableAssetSerializer

    def __init__(self, *args, **kwargs):
        super(GenericAssetSearchAPI, self).__init__(*args, **kwargs)
        self._search_request:SearchRequestSerializer = None

    def get_queryset(self):
        from django.db.models import Q
        if self._search_request is None:
            raise Exception("no search request saved")
        queryset = DeliverableAsset.objects.all()

        if self._search_request.validated_data["title"] and self._search_request.validated_data["title"]!="":
            queryset = queryset.filter(Q(filename__icontains=self._search_request.validated_data["title"]) | \
                                           Q(gnm_website_master__website_title__icontains=self._search_request.validated_data["title"]) | \
                                           Q(mainstream_master__mainstream_title__icontains=self._search_request.validated_data["title"]) | \
                                           Q(DailyMotion_master__daily_motion_title__icontains=self._search_request.validated_data["title"]) | \
                                           Q(youtube_master__youtube_title__icontains=self._search_request.validated_data["title"]))

        if self._search_request.validated_data["atom_id"] and self._search_request.validated_data["atom_id"]!="":
            queryset = queryset.filter(atom_id=self._search_request.validated_data["atom_id"])

        if self._search_request.validated_data["commission_id"] and self._search_request.validated_data["commission_id"]!=0:
            queryset = queryset.filter(deliverable__commission_id=self._search_request.validated_data["commission_id"])

        if self._search_request.validated_data["order_by"]:
            queryset = queryset.order_by(self._search_request.validated_data["order_by"])
        else:
            queryset = queryset.order_by("-modified_dt")

        return queryset

    def get(self, request, *args, **kwargs):
        return Response({"status":"error","detail":"GET not supported on this endpoint"}, status=405)

    def post(self, request, *args, **kwargs):
        rq = SearchRequestSerializer(data=request.data)
        if not rq.is_valid(raise_exception=False):
            return Response({"status":"bad_request", "missing_fields": [str(x) for x in rq.errors]}, status=400)

        self._search_request = rq
        try:
            return super(GenericAssetSearchAPI, self).get(request, *args, **kwargs)
        except Exception as e:
            logger.exception("could not perform asset search: ", exc_info=e)
            return Response({"status":"error", "detail": str(e)}, status=500)


class BundlesForCommission(ListAPIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    serializer_class = DeliverableSerializer

    def get_queryset(self):
        return Deliverable.objects.filter(commission_id=self.kwargs['commissionId'])


class RetryJobForAsset(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)

    def put(self, request, job_id, asset_id):
        try:
            vs_api = VSApi(url=settings.VIDISPINE_URL,
                           user=settings.VIDISPINE_USER,
                           passwd=settings.VIDISPINE_PASSWORD)
            vs_job_data = vs_api.request("/job/{0}/re-run".format(job_id), method="POST")
            asset = DeliverableAsset.objects.get(id=asset_id)
            asset.job_id = vs_job_data.find("{http://xml.vidispine.com/schema/vidispine}jobId").text
            asset.status = DELIVERABLE_ASSET_STATUS_INGESTING
            asset.save()
            return Response({"status": "ok", "detail": "New job created with id.: {0}".format(asset.job_id)}, status=200)
        except VSNotFound:
            logger.error("The job did not exist when attempting to retry job {0} for asset {1}: {2}".format(job_id , asset_id, str(e)))
            return Response({"status": "notfound", "detail": "That job does not exist in Vidispine"}, status=404)
        except Exception as e:
            logger.error("An error occurred when attempting to retry job {0} for asset {1}: {2}".format(job_id , asset_id, str(e)))
            return Response({"status": "error", "detail": str(e)}, status=500)


class InvalidAPIList(ListAPIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    serializer_class = DeliverableAssetSerializer

    def get_queryset(self):
        data_limit = 128

        if 'limit' in self.request.GET:
            data_limit = int(self.request.GET["limit"])

        if 'date' in self.request.GET:
            return DeliverableAsset.objects.filter(access_dt__icontains=self.request.GET["date"]).exclude(status=DELIVERABLE_ASSET_STATUS_INGESTING).exclude(status=DELIVERABLE_ASSET_STATUS_INGESTED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODING)[0:data_limit]
        elif 'type' in self.request.GET:
            return DeliverableAsset.objects.filter(type=self.request.GET["type"]).exclude(status=DELIVERABLE_ASSET_STATUS_INGESTING).exclude(status=DELIVERABLE_ASSET_STATUS_INGESTED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODING)[0:data_limit]
        elif 'status' in self.request.GET:
            return DeliverableAsset.objects.filter(status=self.request.GET["status"])[0:data_limit]
        else:
            return DeliverableAsset.objects.exclude(status=DELIVERABLE_ASSET_STATUS_INGESTING).exclude(status=DELIVERABLE_ASSET_STATUS_INGESTED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODING)[0:data_limit]

    def get(self, *args, **kwargs):
        try:
            return super(InvalidAPIList, self).get(*args, **kwargs)
        except Exception as e:
            logger.exception("Could not load invalid deliverable assets: {0}".format(str(e)))
            return Response({"status":"error","detail":"Could not load invalid deliverable assets: {0}".format(str(e))}, status=500)


class CountInvalid(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def get(self, *args, **kwargs):
        try:
            result = [ DeliverableAsset.objects.filter(access_dt__icontains=datetime.strftime((datetime.now() - timedelta(i)), '%Y-%m-%d')).exclude(status=DELIVERABLE_ASSET_STATUS_INGESTING).exclude(status=DELIVERABLE_ASSET_STATUS_INGESTED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODING).count() for i in range(11, -1, -1)]

            return Response(result, status=200)
        except Exception:
            return Response({"status":"error","detail":"Could not process invalid count."}, status=500)


class CountInvalidByType(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def get(self, *args, **kwargs):
        try:
            result = [ DeliverableAsset.objects.filter(type=i).exclude(status=DELIVERABLE_ASSET_STATUS_INGESTING).exclude(status=DELIVERABLE_ASSET_STATUS_INGESTED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODED).exclude(status=DELIVERABLE_ASSET_STATUS_TRANSCODING).count() for i in range(1, 16, 1)]

            return Response(result, status=200)
        except Exception:
            return Response({"status":"error","detail":"Could not process invalid count."}, status=500)


class CountInvalidByStatus(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def get(self, *args, **kwargs):
        try:
            result = DeliverableAsset.objects.values("status").annotate(Count("id"))

            return Response(result, status=200)
        except Exception as e:
            logger.exception("Could not process invalid count: {0}".format(str(e)))
            return Response({"status":"error","detail":"Could not process invalid count: {0}".format(str(e))}, status=500)


class TestAndFixDropfolder(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated, )
    renderer_classes = (JSONRenderer, )

    def get(self, *args, **kwargs):
        project_id = kwargs.get("project_id")
        if project_id is None:  #the router should prevent this from happening but there's no harm in handling the case here
            return Response({"status": "error", "detail": "bad request"}, status=400)
        try:
            bundle = Deliverable.objects.get(pluto_core_project_id=project_id)
            bundle.create_folder_for_deliverable()
            return Response({"status": "ok", "clientpath": bundle.local_path})
        except Deliverable.DoesNotExist:
            return Response({"status": "notfound", "detail": "Invalid deliverable bundle"}, status=404)
        except Exception as e:
            logger.exception("TestAndFixDropfolder got an unexpected error: {0}".format(str(e)))
            return Response({"status": "error", "detail": str(e)}, status=500)


class GetYouTubeCategory(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)

    def get(self, request, category_id):
        try:
            category = YouTubeCategories.objects.get(identity=category_id)
            return Response({"title": category.title}, status=200)
        except YouTubeCategories.DoesNotExist:
            return Response({"status": "error", "detail": "Category not known."}, status=404)
        except KeyError:
            return Response({"status": "error", "detail": "You must specify a category identity."}, status=400)


class GetYouTubeChannel(APIView):
    authentication_classes = (JwtRestAuth, HmacRestAuth)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)

    def get(self, request, channel_id):
        try:
            channel = YouTubeChannels.objects.get(identity=channel_id)
            return Response({"title": channel.title}, status=200)
        except YouTubeChannels.DoesNotExist:
            return Response({"status": "error", "detail": "Channel not known."}, status=404)
        except KeyError:
            return Response({"status": "error", "detail": "You must specify a channel identity."}, status=400)