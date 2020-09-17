from rest_framework.serializers import Serializer, ModelSerializer, CharField, IntegerField
from .models import AtomResponderMessage


class MockSerializer(Serializer):
    id = IntegerField()
    title = CharField()


class AtomMessageSerializer(ModelSerializer):
    class Meta:
        model = AtomResponderMessage
        fields = "__all__"
