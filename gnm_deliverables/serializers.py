from django.utils.functional import cached_property
from rest_framework import serializers

from .models import DeliverableAsset, Deliverable, GNMWebsite, Youtube, Mainstream, DailyMotion, LogEntry
from .choices import DELIVERABLE_ASSET_STATUSES_DICT

class DeliverableAssetSerializer(serializers.ModelSerializer):
    version = serializers.SerializerMethodField('get_version')
    duration = serializers.SerializerMethodField('get_duration')
    type_string = serializers.CharField(read_only=True)
    size_string = serializers.CharField(read_only=True)
    status_string = serializers.SerializerMethodField('get_status_string')
    changed_string = serializers.CharField(read_only=True)

    @cached_property
    def user(self):
        if 'request' in self.context:
            return self.context['request'].user.username
        else:
            return "admin"

    def get_status_string(self, obj):
        return DELIVERABLE_ASSET_STATUSES_DICT.get(obj.status, "(not set)")

    # def get_has_ongoing_job(self, obj):
    #     return obj.has_ongoing_job(self.user)

    def get_version(self, obj):
        return obj.version(self.user)

    def get_duration(self, obj):
        return obj.duration(self.user)

    class Meta:
        model = DeliverableAsset
        fields = 'id type filename size access_dt modified_dt changed_dt job_id online_item_id nearline_item_id archive_item_id ' \
                 'deliverable status type_string version duration size_string status_string changed_string'.split()
        read_only_fields = 'id filename size access_dt modified_dt changed_dt job_id item_id deliverable'.split()


class DeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = ["project_id", "commission_id", "pluto_core_project_id", "name", "created", "local_open_uri", "local_path"]


class GNMWebsiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GNMWebsite
        fields = ["media_atom_id", "upload_status", "production_office", "tags", "publication_date", "website_title",
                  "website_description", "primary_tone", "publication_status"]


class MainstreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mainstream
        fields = ["mainstream_title", "mainstream_description", "mainstream_tags", "mainstream_rules_contains_adult_content",
                  "upload_status"]


class YoutubeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Youtube
        fields = ["youtube_id", "youtube_title", "youtube_description", "youtube_tags", "youtube_categories", "youtube_channels",
                  "publication_date"]


class DailyMotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMotion
        fields = ["daily_motion_url", "daily_motion_title", "daily_motion_description", "daily_motion_tags", "daily_motion_category",
                  "publication_date", "upload_status", "daily_motion_no_mobile_access", "daily_motion_contains_adult_content"]


class LogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogEntry
        fields = ["timestamp", "related_gnm_website", "related_youtube", "related_daily_motion", "related_mainstream", "sender",
                  "log_line"]