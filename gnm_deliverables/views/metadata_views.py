# coding: utf-8

import logging

from django.core.exceptions import ObjectDoesNotExist
from django.db.models.functions import Now
# from gnm_misc_utils.csrf_exempt_session_authentication import CsrfExemptSessionAuthentication
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView

from gnm_deliverables.jwt_auth_backend import JwtRestAuth
from gnm_deliverables.models import DeliverableAsset, GNMWebsite, Mainstream, Youtube, DailyMotion, \
    LogEntry
from gnm_deliverables.serializers import GNMWebsiteSerializer, \
    YoutubeSerializer, MainstreamSerializer, DailyMotionSerializer

logger = logging.getLogger(__name__)


class MetadataAPIView(APIView):
    metadata_model = None
    metadata_serializer = None
    authentication_classes = (JwtRestAuth,)

    def get(self, request, project_id, asset_id, *args, **kwargs):
        try:
            metadata = self.metadata_model.objects.get(
                deliverableasset__deliverable__pluto_core_project_id__exact=project_id,
                deliverableasset=asset_id)
            return Response(self.metadata_serializer(metadata).data)
        except ObjectDoesNotExist:
            return Response(status=404)

    def put(self, request, project_id, asset_id, *args, **kwargs):
        try:
            asset = DeliverableAsset.objects.get(
                deliverable__pluto_core_project_id__exact=project_id, pk=asset_id)
            try:
                return self.put_update(request, asset, project_id, asset_id)
            except ObjectDoesNotExist:
                return self.put_insert(request, asset, project_id, asset_id)
        except ObjectDoesNotExist:
            return Response({"status": "error", "detail": "Asset not known"}, status=404)
        except Exception as e:
            return Response({"status": "error", "detail": str(e)}, status=500)

    def put_insert(self, request, asset, project_id, asset_id):
        put = self.metadata_serializer(data=request.data)
        if 'etag' in request.data or self.is_metadata_set(project_id, asset_id):
            return Response({"status": "error", "detail": "conflict"}, status=409)
        if put.is_valid():
            created = put.save()
            self.update_asset_metadata(asset, created)
            asset.save()
            return Response({"status": "ok", "data": self.metadata_serializer(created).data},
                            status=200)
        else:
            return Response({"status": "error", "detail": put.errors}, status=400)

    def put_update(self, request, asset, project_id, asset_id):
        existing = self.metadata_model.objects.get(
            deliverableasset__deliverable__pluto_core_project_id__exact=project_id,
            deliverableasset=asset_id)

        current_etag = existing.etag.strftime('%Y-%m-%dT%H:%M:%S.%fZ')
        if current_etag == request.data.get('etag', None):
            del request.data['etag']
            put = self.metadata_serializer(existing, data=request.data)
            if put.is_valid():
                put.validated_data['etag'] = Now()
                update_count = self.metadata_model.objects.filter(pk=existing.id,
                                                                  etag=current_etag).update(
                    **put.validated_data)
                if update_count == 0:
                    return Response({"status": "error", "detail": "etag conflict"}, status=409)
                elif update_count == 1:
                    updated = self.metadata_model.objects.get(pk=existing.id)
                    return Response(
                        {"status": "ok", "data": self.metadata_serializer(updated).data},
                        status=200)
                else:
                    return Response({"status": "error", "detail": "internal"}, status=500)
            else:
                return Response({"status": "error", "detail": put.errors}, status=400)
        else:
            return Response({"status": "error", "detail": "etag conflict"}, status=409)

    def delete(self, request, project_id, asset_id):
        try:
            entry = self.metadata_model.objects.get(
                deliverableasset__deliverable__pluto_core_project_id__exact=project_id,
                deliverableasset=asset_id)
            entry.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ObjectDoesNotExist:
            return Response({"status": "error", "detail": "Asset not known"}, status=404)

    def head(self, request, project_id, asset_id):
        try:
            metadata = self.metadata_model.objects.get(
                deliverableasset__deliverable__pluto_core_project_id__exact=project_id,
                deliverableasset=asset_id)
            return Response(status=204, headers={"ETag": metadata.etag})
        except ObjectDoesNotExist:
            return Response({"status": "error", "detail": "asset not found"}, status=404)

    def update_asset_metadata(self, asset, metadata):
        pass

    def is_metadata_set(self, project_id, asset_id):
        pass


class GNMWebsiteAPIView(MetadataAPIView):
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)
    metadata_model = GNMWebsite
    metadata_serializer = GNMWebsiteSerializer

    def update_asset_metadata(self, asset, metadata):
        asset.gnm_website_master = metadata

    def is_metadata_set(self, project_id, asset_id):
        asset = DeliverableAsset.objects.get(deliverable__pluto_core_project_id__exact=project_id,
                                             pk=asset_id)
        return asset.gnm_website_master is not None


class MainstreamAPIView(MetadataAPIView):
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)
    metadata_model = Mainstream
    metadata_serializer = MainstreamSerializer

    def update_asset_metadata(self, asset, metadata):
        asset.mainstream_master = metadata

    def is_metadata_set(self, project_id, asset_id):
        asset = DeliverableAsset.objects.get(deliverable__pluto_core_project_id__exact=project_id,
                                             pk=asset_id)
        return asset.mainstream_master is not None


class YoutubeAPIView(MetadataAPIView):
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)
    metadata_model = Youtube
    metadata_serializer = YoutubeSerializer

    def update_asset_metadata(self, asset, metadata):
        asset.youtube_master = metadata

    def is_metadata_set(self, project_id, asset_id):
        asset = DeliverableAsset.objects.get(deliverable__pluto_core_project_id__exact=project_id,
                                             pk=asset_id)
        return asset.youtube_master is not None


class DailyMotionAPIView(MetadataAPIView):
    renderer_classes = (JSONRenderer,)
    parser_classes = (JSONParser,)
    metadata_model = DailyMotion
    metadata_serializer = DailyMotionSerializer

    def update_asset_metadata(self, asset, metadata):
        asset.DailyMotion_master = metadata

    def is_metadata_set(self, project_id, asset_id):
        asset = DeliverableAsset.objects.get(deliverable__pluto_core_project_id__exact=project_id,
                                             pk=asset_id)
        return asset.DailyMotion_master is not None


class PlatformLogsView(APIView):
    authentication_classes = (JwtRestAuth,)

    def get(self, request, project_id, asset_id, platform):
        try:
            asset = DeliverableAsset.objects.get(
                deliverable__pluto_core_project_id__exact=project_id, pk=asset_id)
        except ObjectDoesNotExist:
            return Response({"status": "error", "details": "not found"}, status=404)
        if platform == 'youtube' and asset.youtube_master_id:
            log_entries = LogEntry.objects.filter(related_youtube=asset.youtube_master_id)
        elif platform == 'gnmwebsite' and asset.gnm_website_master_id:
            log_entries = LogEntry.objects.filter(
                related_gnm_website_id=asset.gnm_website_master_id)
        elif platform == 'mainstream' and asset.mainstream_master_id:
            log_entries = LogEntry.objects.filter(related_mainstream=asset.mainstream_master_id)
        elif platform == 'dailymotion' and asset.DailyMotion_master_id:
            log_entries = LogEntry.objects.filter(related_daily_motion=asset.DailyMotion_master_id)
        else:
            return Response({"status": "error", "details": "not found"}, status=404)
        data = [entry.log_line for entry in log_entries.order_by('-timestamp')]
        return Response({"logs": data}, status=200)
