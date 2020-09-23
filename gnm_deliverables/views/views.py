# coding: utf-8

import functools  # for reduce()
import logging
import re
import urllib.parse
import urllib.parse
from datetime import datetime

from django.conf import settings
from django.contrib import messages
from django.core.exceptions import ValidationError
from django.db.models import Q
from django.forms.models import modelformset_factory
from django.http import Http404
from django.shortcuts import redirect
from django.urls import reverse
from django.views.generic import TemplateView
from django.views.generic.detail import SingleObjectMixin
from gnmvidispine.vidispine_api import VSNotFound, VSException
from rest_framework import mixins, status
from rest_framework.authentication import BasicAuthentication
from rest_framework.generics import GenericAPIView, RetrieveUpdateAPIView, RetrieveAPIView, \
    ListAPIView, CreateAPIView
from rest_framework.parsers import JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.status import HTTP_409_CONFLICT
from rest_framework.views import APIView

from gnm_deliverables.choices import DELIVERABLE_ASSET_TYPES, \
    DELIVERABLE_ASSET_STATUS_NOT_INGESTED, \
    DELIVERABLE_ASSET_STATUS_INGESTED, \
    DELIVERABLE_ASSET_STATUS_INGEST_FAILED, DELIVERABLE_ASSET_STATUS_INGESTING, \
    DELIVERABLE_ASSET_STATUS_TRANSCODED, \
    DELIVERABLE_ASSET_STATUS_TRANSCODE_FAILED, DELIVERABLE_ASSET_STATUS_TRANSCODING
from gnm_deliverables.exceptions import NoShapeError
from gnm_deliverables.files import create_folder_for_deliverable
from gnm_deliverables.forms import DeliverableCreateForm
from gnm_deliverables.jwt_auth_backend import JwtRestAuth
from gnm_deliverables.models import Deliverable, DeliverableAsset
from gnm_deliverables.serializers import DeliverableAssetSerializer, DeliverableSerializer
from gnm_deliverables.vs_notification import VSNotification

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
            "media_atom_uri": settings.MEDIA_ATOM_TOOL_URI
        }


class NewDeliverablesAPIList(ListAPIView):
    authentication_classes = (JwtRestAuth,)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    serializer_class = DeliverableSerializer

    def get_queryset(self):
        ###FIXME: need to implement pagination, total count, etc.
        return Deliverable.objects.all()


class NewDeliverablesApiGet(RetrieveAPIView):
    authentication_classes = (JwtRestAuth,)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    queryset = Deliverable.objects
    serializer_class = DeliverableSerializer
    lookup_url_kwarg = "bundleId"
    lookup_field = "pluto_core_project_id"


class NewDeliverablesAPICreate(CreateAPIView):
    authentication_classes = (JwtRestAuth,)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)
    serializer_class = DeliverableSerializer

    def post(self, request, *args, **kwargs):
        bundle = DeliverableSerializer(data=request.data)

        if bundle.is_valid():
            name = bundle.validated_data['name']

            try:
                path, created = create_folder_for_deliverable(name)
                if created and path:
                    logger.info('Created folder for deliverable at: %s', path)

                    bundle.save()
                    return Response({"status": "ok", "data": bundle.data}, status=200)
                elif not created and path:
                    logger.error('The folder already exists for deliverable at: %s', path)
                    return Response({"status": "already exists", "data": bundle.data}, status=200)
                else:
                    logger.error('Failed to create folder for deliverable at:  %s',path)
                    return Response({"status": "error", "data": bundle.data}, status=409)

            except OSError as e:
                logger.error(request,
                             'Failed to create folder for {name}: {e}'.format(name=name,
                                                                              e=e.strerror))
                return Response({"status": "error", "data": e.strerror}, status=500)
        else:
            for field, error_details in bundle.errors.items():
                uniqueness_errors = list(filter(lambda entry: entry.code=='unique', error_details))
                if len(uniqueness_errors)>0:
                    return Response({"status":"conflict","field": field,"detail":"This field must be a unique value"}, status=409)

            return Response({"status": "error", "detail": str(bundle.errors)}, status=400)


class NewDeliverableAssetAPIList(ListAPIView):
    authentication_classes = (JwtRestAuth,)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    serializer_class = DeliverableAssetSerializer

    def get_queryset(self):
        bundle_id = self.request.GET["project_id"]
        parent_bundle = Deliverable.objects.get(pluto_core_project_id=bundle_id)
        return DeliverableAsset.objects.filter(deliverable=parent_bundle)

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
    authentication_classes = (JwtRestAuth,)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def delete(self, *args, **kwargs):
        bundle_id = self.request.GET["project_id"]
        parent_bundle = Deliverable.objects.get(pluto_core_project_id=bundle_id)
        deliverables = DeliverableAsset.objects.filter(deliverable=parent_bundle,
                                                       pk__in=self.request.data)

        deliverables.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)


class CountDeliverablesView(APIView):
    authentication_classes = (JwtRestAuth,)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def get(self, *args, **kwargs):
        bundle_id = self.kwargs["project_id"]
        try:
            parent_bundle = Deliverable.objects.get(pluto_core_project_id=bundle_id)
            deliverables_count = DeliverableAsset.objects.filter(deliverable=parent_bundle, ).count()
            unimported_count = DeliverableAsset.objects.filter(deliverable=parent_bundle,
                                                               ingest_complete_dt__isnull=True).count()

            result = {'total_asset_count': deliverables_count,
                      'unimported_asset_count': unimported_count}

            return Response(result, status=200)
        except Deliverable.DoesNotExist:
            return Response({"status":"notfound","detail":"Deliverable bundle does not exist"}, status=404)


class NewDeliverableAPIScan(APIView):
    authentication_classes = (JwtRestAuth,)
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
    authentication_classes = (JwtRestAuth,)
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
    authentication_classes = (JwtRestAuth,)
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
    authentication_classes = (JwtRestAuth,)
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


class VSNotifyView(APIView):
    authentication_classes = (BasicAuthentication,)  # we need to bypass the default of JwtAuthentication for the tests to work.
    permission_classes = (AllowAny,)  # we don't have authentication on the VS endpoint

    def post(self, request):
        logger.debug("Received content from Vidispine: {0}".format(request.body))
        try:
            content = VSNotification.from_bytes(request.body)
        except Exception as e:
            logger.exception("Could not interpret content from Vidispine: ", exc_info=e)
            return Response({"status": "error", "detail": str(e)}, status=400)

        (itemId, jobId, fileId) = content.vsIDs

        try:
            ## Search only on the job id, that way we will pick up ones that were initiated by atomresponder too!
            asset = DeliverableAsset.objects.get(job_id=jobId)
        except DeliverableAsset.DoesNotExist:
            logger.warning("Received a notification for asset {0} that does not exist".format(
                content.asset_id))
            return Response(data=None, status=200)  # VS doesn't need to know, nod and smile

        if content.didFail:
            if content.type == "TRANSCODE":
                asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODE_FAILED
            else:
                asset.status = DELIVERABLE_ASSET_STATUS_INGEST_FAILED
            asset.ingest_complete_dt = datetime.now()
            asset.save()
        elif content.isRunning:
            if content.type == "TRANSCODE":
                asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODING
            else:
                asset.status = DELIVERABLE_ASSET_STATUS_INGESTING
            asset.save()
        elif content.status == "FINISHED":
            if content.type == "TRANSCODE":
                asset.status = DELIVERABLE_ASSET_STATUS_TRANSCODED
            else:
                asset.online_item_id = itemId
                asset.status = DELIVERABLE_ASSET_STATUS_INGESTED
                try:
                    asset.create_proxy()
                except Exception as e:
                    logger.exception(
                        "{0} for asset {1} in bundle {2}: could not create proxy due to:".format(
                            asset.online_item_id,
                            asset.id,
                            asset.deliverable.id),
                        exc_info=e)

            # don't delete local files here. We pick those up with a timed job run via a mgt command
            asset.ingest_complete_dt = datetime.now()

            asset.save()
        else:
            logger.warning(
                "Received unknown job status {0} from {1}".format(content.status, jobId))
        return Response(data=None, status=200)


class DeliverableAPIStarted(APIView):
    authentication_classes = (JwtRestAuth,)
    permission_classes = (IsAuthenticated,)
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)

    def get(self, *args, **kwargs):
        bundle_id = self.request.GET["bundleId"]
        try:
            parent_bundle = Deliverable.objects.get(pk=bundle_id)

            if parent_bundle.assets.filter(status=DELIVERABLE_ASSET_STATUS_NOT_INGESTED).exists():
                result = {'ingests_started': False}
            else:
                result = {'ingests_started': True}
            return Response(result, status=200)
        except Deliverable.DoesNotExist:
            return Response({"status": "error", "detail": "Bundle not known"}, status=404)
        except KeyError:
            return Response({"status": "error", "detail": "You must specify a bundleId= query parameter"}, status=400)