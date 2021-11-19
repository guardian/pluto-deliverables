from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.renderers import JSONRenderer
from dateutil.parser import parse as parse_date
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from gnm_deliverables.serializers import DenormalisedAssetSerializer
from gnm_deliverables.jwt_auth_backend import JwtRestAuth
from datetime import datetime
import logging
from gnm_deliverables.models import *


logger = logging.getLogger(__name__)


class DeliverableAssetsList(ListAPIView):
    renderer_classes = (JSONRenderer, )
    authentication_classes = (JwtRestAuth, BasicAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated, )
    serializer_class = DenormalisedAssetSerializer

    def get_queryset(self):
        """
        build a queryset from the provided parameters.
        Parameters are expected as GET request params:
        - startDate: (ISO datetime)
        - endDate: (ISO datetime)
        [- deliverableType is done in frontend]
        - atomId: (string)
        :return:
        """
        end_date = datetime.now()
        start_date = end_date.replace(day=1,hour=23,minute=59,second=59,microsecond=999)
        if "startDate" in self.request.GET:
            try:
                start_date = parse_date(self.request.GET["startDate"])
            except Exception as err:
                logger.warning("Could not parse provided string {0} as a date: {1}".format(start_date, err))
        if "endDate" in self.request.GET:
            try:
                end_date = parse_date(self.request.GET["endDate"])
            except Exception as err:
                logger.warning("Could not parse provided string {0} as a date: {1}".format(end_date, err))

        queryset = DeliverableAsset.objects.select_related().filter(changed_dt__gte=start_date, changed_dt__lte=end_date)

        if "atomId" in self.request.GET:
            queryset = GNMWebsite.objects.select_related().filter(media_atom_id=self.request.GET["atomId"])

        return queryset[0:100]

    def dispatch(self, *args, **kwargs):
        try:
            return super(DeliverableAssetsList, self).dispatch(*args, **kwargs)
        except Exception as e:
            logger.error("Could not list deliverables for {0}: {1}".format(self.request.GET, str(e)))
            Response()