from rest_framework.serializers import Serializer, ModelSerializer
from .models import AtomResponderMessage


class AtomMessageSerializer(ModelSerializer):
    class Meta:
        model = AtomResponderMessage
        fields = "__all__"
