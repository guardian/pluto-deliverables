# coding: utf-8

import logging

from django.core.exceptions import ObjectDoesNotExist
from django.db.models.functions import Now
from rest_framework import status
from rest_framework.parsers import JSONParser
from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from gnm_deliverables.inmeta import inmeta_to_string
from django.conf import settings
import os
from gnm_deliverables.jwt_auth_backend import JwtRestAuth
from gnm_deliverables.models import DeliverableAsset, GNMWebsite, Mainstream, Youtube, DailyMotion, \
    LogEntry
import json
from gnm_deliverables.serializers import *
from rabbitmq.time_funcs import get_current_time
import requests
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

    def dispatch(self, request, *args, **kwargs):
        try:
            return super(MainstreamAPIView, self).dispatch(request, *args, **kwargs)
        except Exception as e:
            logger.error("Could not get youtube deliverable metadata: {0}".format(str(e)), e)
            return Response({"status":"error","detail":str(e)}, status=500)

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

    def dispatch(self, request, *args, **kwargs):
        try:
            return super(YoutubeAPIView, self).dispatch(request, *args, **kwargs)
        except Exception as e:
            logger.error("Could not get youtube deliverable metadata: {0}".format(str(e)), e)
            return Response({"status":"error","detail":str(e)}, status=500)


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

    def dispatch(self, request, *args, **kwargs):
        try:
            return super(DailyMotionAPIView, self).dispatch(request, *args, **kwargs)
        except Exception as e:
            logger.error("Could not get youtube deliverable metadata: {0}".format(str(e)), e)
            return Response({"status":"error","detail":str(e)}, status=500)


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

        qs = log_entries.order_by('-timestamp')
        if "limit" in request.GET:
            try:
                limit = int(request.GET["limit"])
                qs = log_entries.order_by('-timestamp')[0:limit]
            except Exception as e:
                logger.warning("limit parameter {0} was not valid: {1}".format(request.GET['limit'], str(e)))

        if "full" in request.GET:
            data = [LogEntrySerializer(entry).data for entry in qs]
        else:
            data = [entry.log_line for entry in qs]
        return Response({"logs": data}, status=200)


class PlatformLogUpdateView(APIView):
    authentication_classes = (BasicAuthentication, )
    parser_classes = (JSONParser, )
    renderer_classes = (JSONRenderer, )
    permission_classes = (IsAuthenticated, )

    def post(self, request, project_id, asset_id, platform:str):
        """
        receives a log update and saves it.
        expects a JSON body in the format { "sender": "sender-name",
         "log": "log-line",
         "completed":true/false/absent,
         "failed":true/false/absent,
         "uploadedUrl":"url" [optional, ignored unless completed=true and failed=false/absent]
         }.
        logs are timestamped as they arrive
        :param request:
        :param project_id:
        :param asset_id:
        :param platform:
        :return:
        """
        try:
            asset = DeliverableAsset.objects.get(pk=asset_id)

            newentry = LogEntry(
                timestamp=get_current_time(),
                sender=request.data["sender"],
                log_line=request.data["log"]
            )

            did_fail = False
            did_succeed = False
            asset_needs_save = False
            logger.debug("Received CDS update: {0}".format(request.data))

            if "completed" in request.data and request.data["completed"]:
                if "failed" in request.data and request.data["failed"]:
                    did_fail = True
                else:
                    did_succeed = True

            lcplatform = platform.lower()
            if lcplatform=="dailymotion":
                if asset.DailyMotion_master is None:
                    logger.error("Received daily motion syndication progress for {0} but no DN record exists on this asset".format(asset_id))
                    return Response({"status": "invalid_target","detail":"no daily motion metadata to update"}, status=404)
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
                    asset.DailyMotion_master.publication_date = get_current_time()
                    if "uploadedUrl" in request.data:
                        asset.DailyMotion_master.daily_motion_url = request.data["uploadedUrl"]
                    asset.DailyMotion_master.save()
            elif lcplatform=="mainstream":
                if asset.mainstream_master is None:
                    logger.error("Received Mainstream syndication progress for {0} but no MS record exists on this asset".format(asset_id))
                    return Response({"status": "invalid_target","detail":"no MS metadata to update"}, status=404)
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
                    asset.mainstream_master.publication_date = get_current_time()
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

    def post(self, *args, **kwargs):
        try:
            return self.do_post(*args, **kwargs)
        except Exception as e:
            logger.error("Could not trigger metadata output: {0}".format(str(e)))
            logger.exception("Trace was ", exc_info=e)
            return Response({"status":"uncaught_error", "detail":str(e)})

    def do_post(self, request, project_id:int, platform:str, asset_id:int):
        from gnm_deliverables.signals import MessageRelay
        try:
            asset:DeliverableAsset = DeliverableAsset.objects.get(pk=asset_id)
        except DeliverableAsset.DoesNotExist:
            return Response({"status":"error","details":"Asset not found"}, status=404)

        try:
            relay = MessageRelay()
        except Exception as e:
            logger.error("Could not initialise message relay: {0}".format(e))
            return Response({"status":"error","details": "could not initialise message relay"}, status=500)

        routes_map:dict = getattr(settings, "CDS_ROUTE_MAP")
        if routes_map is None:
            logger.error("Could not find CDS_ROUTE_MAP in the configuration")
            return Response({"status":"config_error","details": "CDS_ROUTE_MAP not in configuration"}, status=500)

        platform_name = platform.lower()
        route_name = routes_map.get(platform_name)
        if route_name is None:
            logger.error("Platform {0} was not recognised. CDS_ROUTE_MAP has {1}".format(platform_name, routes_map))
            return Response({"status":"bad_request","detail": "Platform name not recognised"}, status=400)

        routing_key = "deliverables.syndication.{0}.upload".format(platform_name)

        message_content = {
            "inmeta": inmeta_to_string(asset, platform_name),
            "deliverable_asset": asset.pk,
            "deliverable_bundle": asset.deliverable.pk,
            "filename": os.path.basename(asset.filename),
            "online_id": asset.online_item_id,
            "nearline_id": asset.nearline_item_id,
            "archive_id": asset.archive_item_id,
            "routename": route_name
        }
        try:
            encoded_payload = json.dumps(message_content).encode("UTF-8")
        except Exception as e:
            logger.error("Could not encode the message content payload: {0}".format(str(e)))
            logger.error("Offending content was {0}".format(message_content))
            return Response({"status":"error","detail":str(e)})

        try:
            relay.send_content(routing_key, encoded_payload)
            return Response({"status":"ok","routing_key":routing_key})
        except Exception as e:
            logger.error("Could not send message to {0}: {1}".format(routing_key, str(e)))
            return Response({"status":"error","detail": "Could not send message to broker"}, status=500)


class ResyncToPublished(APIView):
    authentication_classes = (JwtRestAuth, BasicAuthentication, SessionAuthentication, )    #SessionAuthentication is needed for tests to work
    renderer_classes = (JSONRenderer, )
    permission_classes = (IsAuthenticated, )

    def post(self, request, project_id:int, asset_id:int):
        try:
            asset = DeliverableAsset.objects.get(pk=asset_id)
        except DeliverableAsset.DoesNotExist:
            return Response({"status":"error","details":"Asset not found"}, status=404)

        if asset.atom_id is None:
            return Response({"status":"error","details":"Asset is not from an atom","asset_id":asset_id}, status=400)

        try:
            url = settings.LAUNCH_DETECTOR_URL + "/update/" + str(asset.atom_id)
            logger.info("Update URL for asset {aid} on project {pid} is {url}".format(aid=asset_id,pid=project_id,url=url))
            response = requests.put(url)

            logger.info("Updating {pid}/{aid}: Launch detector said {status} {msg}".format(aid=asset_id,pid=project_id,
                                                                                           status=response.status_code,
                                                                                           msg=response.content))
            #simply echo the Launch Detector's response back to the client
            return Response(response.json(), status=response.status_code)
        except requests.ConnectTimeout:
            return Response({"status": "error", "error": "Timeout connecting to LaunchDetector, please try again and notify multimediatech@theguardian.com"},status=500)
        except requests.ConnectionError:
            return Response({"status": "error", "error": "Unable to connect to LaunchDetector, please notify multimediatech@theguardian.com"},status=500)
        except Exception as e:
            return Response({"status": "error", "error": str(e)},status=500)