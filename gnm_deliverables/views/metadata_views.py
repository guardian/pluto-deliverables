# coding: utf-8

import logging

from django.core.exceptions import ObjectDoesNotExist
from django.db.models.functions import Now
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.authentication import BasicAuthentication
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from gnm_deliverables.inmeta import write_inmeta
from django.conf import settings
import os
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


class PlatformLogUpdateView(APIView):
    authentication_classes = (BasicAuthentication, )
    parser_classes = (JSONParser, )
    renderer_classes = (JSONRenderer, )

    def post(self, request, project_id, asset_id, platform:str):
        """
        receives a log update and saves it.
        expects a JSON body in the format { "sender": "sender-name", "log": "log-line", "completed":true/false/absent, "failed":true/false/absent }.
        logs are timestamped as they arrive
        :param request:
        :param project_id:
        :param asset_id:
        :param platform:
        :return:
        """
        from datetime import datetime

        try:
            asset = DeliverableAsset.objects.get(pk=asset_id)

            newentry = LogEntry(
                timestamp=datetime.now(),
                sender=request.data["sender"],
                log_line=request.data["log"]
            )

            did_fail = False
            did_succeed = False
            asset_needs_save = False
            if "completed" in request.data and request.data["completed"]:
                if "failed" in request.data and request.data["failed"]:
                    did_fail = True
                else:
                    did_succeed = True

            lcplatform = platform.lower()
            if lcplatform=="dailymotion":
                related_id = asset.DailyMotion_master_id
                newentry.related_daily_motion = asset.DailyMotion_master
                if not did_fail and not did_succeed:
                    if asset.DailyMotion_master.upload_status!='Uploading':
                        asset.DailyMotion_master.upload_status = 'Uploading'
                        asset.DailyMotion_master.save()
                elif did_fail:
                    asset.DailyMotion_master.upload_status='Upload Failed'
                    asset.DailyMotion_master.save()
                elif did_succeed:
                    asset.DailyMotion_master.upload_status='Upload Complete'
                    asset.DailyMotion_master.save()
            elif lcplatform=="mainstream":
                related_id = asset.mainstream_master_id
                newentry.related_mainstream = asset.mainstream_master
                if not did_fail and not did_succeed:
                    if asset.mainstream_master.upload_status!='Uploading':
                        asset.mainstream_master.upload_status = 'Uploading'
                        asset.mainstream_master.save()
                elif did_fail:
                    asset.mainstream_master.upload_status='Upload Failed'
                    asset.mainstream_master.save()
                elif did_succeed:
                    asset.mainstream_master.upload_status='Upload Complete'
                    asset.mainstream_master.save()
            else:
                return Response({"status":"bad_request","detail":"platform not recognised or does not support log entries"}, status=400)

            if related_id is None:
                return Response({"status":"bad_request","detail":"no syndication data for this platform on this id"}, status=400)
            else:
                newentry.save()
                return Response({"status":"ok"},status=200)
        except KeyError as e:
            logger.error("Invalid log updated for {0} {1}: missing key {2}".format(platform, asset_id, str(e)))
            return Response({"status":"bad_request","detail":"{0}: field missing".format(e)},status=400)

        except DeliverableAsset.DoesNotExist:
            return Response({"status":"notfound","detail":"no deliverable asset matching id"},status=404)


class TriggerOutputView(APIView):
    authentication_classes = (JwtRestAuth, )

    def post(self, request, project_id:int, platform:str, asset_id:int):
        try:
            asset = DeliverableAsset.objects.get(pk=asset_id)
        except DeliverableAsset.DoesNotExist:
            return Response({"status":"error","details":"Asset not found"}, status=404)

        output_dir = getattr(settings,"CDS_WATCHFOLDER_PATH")
        if output_dir is None:
            logger.warning("CDS_WATCHFOLDER_PATH not set, can't output syndication")
            return Response({"status":"error","details":"CDS_WATCHFOLDER_PATH not set"}, status=500)

        platform_name = platform.lower()
        if platform_name=="mainstream":
            if not asset.mainstream_master:
                return Response({"status":"error","details":"No mainstream syndication data"}, status=400)
            else:
                filepath = write_inmeta(asset, platform_name, os.path.join(output_dir, platform_name))
                asset.mainstream_master.upload_status = 'Ready for Upload'
                asset.mainstream_master.save()
                return Response({"status":"ok","filepath":filepath})
        elif platform_name=="dailymotion":
            if not asset.DailyMotion_master:
                return Response({"status":"error","details":"No daily motion syndication data"}, status=400)
            else:
                filepath = write_inmeta(asset, platform_name, os.path.join(output_dir, platform_name))
                asset.DailyMotion_master.upload_status = 'Ready for Upload'
                asset.DailyMotion_master.save()
                return Response({"status":"ok","filepath":filepath})
        elif platform_name=="youtube":
            return Response({"status":"error","detail":"Youtube syndication should go via media atom tool"},status=400)
        elif platform_name=="gnmwebsite":
            return Response({"status":"error","detail":"GNM website should go via the media atom tool"},status=400)
        else:
            return Response({"status":"error","detail":"Unrecognised platform name"})