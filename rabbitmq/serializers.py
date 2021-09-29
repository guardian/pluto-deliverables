from rest_framework.serializers import Serializer, ModelSerializer, CharField, IntegerField
from .models import AtomResponderMessage, StoragetierSuccessMessage


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