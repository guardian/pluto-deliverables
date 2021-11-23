from django.utils.functional import cached_property
from rest_framework import serializers

from .choices import DELIVERABLE_ASSET_STATUSES_DICT
from .models import DeliverableAsset, Deliverable, GNMWebsite, Youtube, Mainstream, DailyMotion, \
    LogEntry, SyndicationNotes


class DeliverableAssetSerializer(serializers.ModelSerializer):
    type_string = serializers.CharField(read_only=True)
    size_string = serializers.CharField(read_only=True)
    status_string = serializers.SerializerMethodField('get_status_string')
    changed_string = serializers.CharField(read_only=True)

    @cached_property
    def user(self):
        try:
            return self.context['request'].user.username
        except AttributeError:
            return "admin"
        except KeyError:
            return "admin"

    def get_status_string(self, obj):
        return DELIVERABLE_ASSET_STATUSES_DICT.get(obj.status, "(not set)")

    class Meta:
        model = DeliverableAsset
        fields = ['id', 'type', 'filename', 'size', 'access_dt', 'modified_dt', 'changed_dt',
                  'job_id', 'online_item_id', 'nearline_item_id', 'archive_item_id',
                  'deliverable', 'status', 'type_string', 'atom_id',
                  'size_string', 'status_string', 'changed_string',
                  'gnm_website_master', 'youtube_master', 'DailyMotion_master',
                  'mainstream_master', 'absolute_path', 'linked_to_lowres']
        read_only_fields = ['id', 'filename', 'size', 'access_dt', 'modified_dt',
                            'changed_dt', 'job_id item_id', 'deliverable']


class DenormalisedAssetSerializer(DeliverableAssetSerializer):
    class Meta(DeliverableAssetSerializer.Meta):
        depth = 1


class DeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = ["project_id", "commission_id", "pluto_core_project_id", "name", "created",
                  "local_open_uri", "local_path"]


class GNMWebsiteSerializer(serializers.ModelSerializer):
    class Meta:
        model = GNMWebsite
        fields = ["media_atom_id", "upload_status", "production_office", "tags",
                  "publication_date", "website_title",
                  "website_description", "primary_tone", "publication_status", "etag"]


class MainstreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mainstream
        fields = ["mainstream_title", "mainstream_description", "mainstream_tags",
                  "mainstream_rules_contains_adult_content",
                  "upload_status", "etag"]


class YoutubeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Youtube
        fields = ["youtube_id", "youtube_title", "youtube_description", "youtube_tags",
                  "youtube_category", "youtube_channel",
                  "publication_date", "etag"]


class DailyMotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyMotion
        fields = ["daily_motion_url", "daily_motion_title", "daily_motion_description",
                  "daily_motion_tags", "daily_motion_category",
                  "publication_date", "upload_status", "daily_motion_no_mobile_access",
                  "daily_motion_contains_adult_content", "etag"]


class LogEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LogEntry
        fields = ["timestamp", "related_gnm_website", "related_youtube", "related_daily_motion",
                  "related_mainstream", "sender",
                  "log_line"]


class SearchRequestSerializer(serializers.Serializer):
    title = serializers.CharField(allow_null=True, allow_blank=True, default=None)
    atom_id = serializers.UUIDField(allow_null=True, default=None)
    commission_id = serializers.IntegerField(allow_null=True, default=None)
    order_by = serializers.CharField(allow_null=True, default=None)


class SyndicationNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyndicationNotes
        fields = ["timestamp","username","content","deliverable_asset"]
