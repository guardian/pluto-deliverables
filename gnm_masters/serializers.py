from rest_framework.serializers import ModelSerializer


class MasterSerializer(ModelSerializer):
    class Meta:
        from .models import MasterModel
        fields = ("user title created updated duration commission project gnm_master_standfirst " +
                  "gnm_master_website_headline gnm_master_generic_status gnm_master_generic_intendeduploadplatforms " +
                  "gnm_master_generic_publish gnm_master_generic_remove").split()
        model = MasterModel
