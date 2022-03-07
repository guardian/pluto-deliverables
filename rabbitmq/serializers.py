from rest_framework.serializers import Serializer, ModelSerializer, CharField, IntegerField
from .models import AtomResponderMessage, StoragetierSuccessMessage, CDSResponderMessage


class MockSerializer(Serializer):
    id = IntegerField()
    title = CharField()


class AtomMessageSerializer(ModelSerializer):
    class Meta:
        model = AtomResponderMessage
        fields = "__all__"


class StoragetierSuccessMessageSerializer(ModelSerializer):
    class Meta:
        model = StoragetierSuccessMessage
        fields = "__all__"


class CDSMessageSerializer(ModelSerializer):
    class Meta:
        model = CDSResponderMessage
        fields = 'job-id', 'routename', 'deliverable_asset', 'deliverable_bundle'
        extra_kwargs = {
            'job-id': {'source': 'job_id'},
        }
