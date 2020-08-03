from django.utils.functional import cached_property
from rest_framework import serializers

from .models import DeliverableAsset, Deliverable


class DeliverableAssetSerializer(serializers.ModelSerializer):
    has_ongoing_job = serializers.SerializerMethodField('get_has_ongoing_job')
    status = serializers.SerializerMethodField('get_status')
    version = serializers.SerializerMethodField('get_version')
    duration = serializers.SerializerMethodField('get_duration')
    type_string = serializers.CharField(read_only=True)
    size_string = serializers.CharField(read_only=True)
    status_string = serializers.SerializerMethodField('get_status_string')
    changed_string = serializers.CharField(read_only=True)

    @cached_property
    def user(self):
        return self.context['request'].user

    def get_status(self, obj):
        return obj.status(self.user)

    def get_status_string(self, obj):
        return obj.status_string(self.user)

    def get_has_ongoing_job(self, obj):
        return obj.has_ongoing_job(self.user)

    def get_version(self, obj):
        return obj.version(self.user)

    def get_duration(self, obj):
        return obj.duration(self.user)

    class Meta:
        model = DeliverableAsset
        fields = 'id type filename size access_dt modified_dt changed_dt job_id item_id deliverable has_ongoing_job status type_string version duration size_string status_string changed_string'.split()
        read_only_fields = 'id filename size access_dt modified_dt changed_dt job_id item_id deliverable'.split()


class DeliverableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Deliverable
        fields = ["project_id", "name", "created"]