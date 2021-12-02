from rest_framework.authentication import BasicAuthentication, SessionAuthentication
from rest_framework.renderers import JSONRenderer
from dateutil.parser import parse as parse_date
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from gnm_deliverables.parsers import PlainTextParser
from gnm_deliverables.serializers import DenormalisedAssetSerializer, SyndicationNoteSerializer
from gnm_deliverables.jwt_auth_backend import JwtRestAuth
from datetime import datetime, timedelta
from .numpy_json_rendered import NumpyJSONRenderer
import numpy
import logging
from gnm_deliverables.models import DeliverableAsset, GNMWebsite, SyndicationNotes, Youtube, DailyMotion, Mainstream, ReutersConnect, Oovvuu
import gnm_deliverables.choices as choices
import requests
from django.conf import settings
import urllib.parse
from django.db.models.functions import TruncDay
from django.db.models import Count

logger = logging.getLogger(__name__)
logger.level = logging.DEBUG


class DeliverableAssetsList(ListAPIView):
    renderer_classes = (JSONRenderer,)
    authentication_classes = (JwtRestAuth, BasicAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    serializer_class = DenormalisedAssetSerializer

    def typeForString(self, typeString):
        if typeString == "fullmasters":
            return choices.DELIVERABLE_ASSET_TYPE_VIDEO_FULL_MASTER
        else:
            raise ValueError("Value not found: {0}".format(typeString))

    def get_queryset(self):
        """
        build a queryset from the provided parameters.
        Parameters are expected as GET request params:
        - startDate: (ISO datetime)
        - endDate: (ISO datetime)
        [- deliverableType is done in frontend]
        - atomId: (string)
        - types: "fullmasters"|"all"
        :return:
        """
        end_date = datetime.now()
        start_date = end_date.replace(day=1, hour=23, minute=59, second=59, microsecond=999)
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

        queryset = DeliverableAsset.objects.select_related().filter(changed_dt__gte=start_date,
                                                                    changed_dt__lte=end_date)

        if "types" in self.request.GET and self.request.GET["types"] != "all":
            queryset = queryset.filter(type=self.typeForString(self.request.GET["types"]))

        if "q" in self.request.GET and self.request.GET["q"] != "":
            queryset = queryset.filter(filename__icontains=self.request.GET["q"])
        if "atomId" in self.request.GET:
            queryset = GNMWebsite.objects.select_related().filter(media_atom_id=self.request.GET["atomId"])

        return queryset.order_by("-changed_dt")[0:100]

    def dispatch(self, *args, **kwargs):
        try:
            return super(DeliverableAssetsList, self).dispatch(*args, **kwargs)
        except ValueError as e:
            return Response({"status": "error", "detail": str(e)}, status=400)
        except Exception as e:
            logger.error("Could not list deliverables for {0}: {1}".format(self.request.GET, str(e)))
            return Response({"status": "error", "detail": "Server error, please see logs"}, status=500)


class ListSyndicationNotes(ListAPIView):
    renderer_classes = (JSONRenderer,)
    authentication_classes = (JwtRestAuth, BasicAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    serializer_class = SyndicationNoteSerializer

    def get_queryset(self):
        deliverable_asset_id = self.kwargs.get("asset")
        return SyndicationNotes.objects.filter(deliverable_asset=deliverable_asset_id).order_by("-timestamp")[0:100]


class AddSyndicationNote(APIView):
    renderer_classes = (JSONRenderer,)
    authentication_classes = (JwtRestAuth, BasicAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)
    serializer_class = SyndicationNoteSerializer
    parser_classes = (PlainTextParser,)

    def post(self, *args, **kwargs):
        if len(self.request.data) == 0:
            return Response({"status": "error", "detail": "Message body too short"}, status=400)
        elif len(self.request.data) > 32768:
            return Response({"status": "error", "detail": "Message body too long, limited to 32k"}, status=400)

        try:
            deliverable = DeliverableAsset.objects.get(pk=kwargs["asset"])
            rec = SyndicationNotes(username=self.request.user.username,
                                   deliverable_asset=deliverable,
                                   content=self.request.data)
            rec.save()
            return Response({"status": "ok", "detail": "saved"})
        except DeliverableAsset.DoesNotExist:
            return Response({"status": "error", "detail": "Invalid asset id"}, status=400)
        except Exception as e:
            logger.error("could not create syndication note for record {0}")
            return Response({"status": "error", "detail": str(e)}, status=500)


class GNMWebsiteSearch(APIView):
    renderer_classes = (JSONRenderer,)
    authentication_classes = (JwtRestAuth, BasicAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)

    @staticmethod
    def find_smallest_poster(atom_info):
        """
        finds the smallest posterImage or returns None if there were not any
        :param atom_info: dictionary of atom info. It's expected that this will have a "posterImage" key,
        which will in turn have an "assets" key which is an array
        :return:
        """
        current_size = 9999999
        current_url = None

        try:
            for entry in atom_info["data"]["media"]["posterImage"]["assets"]:
                if "dimensions" in entry and "width" in entry["dimensions"]:
                    if entry["dimensions"]["width"] < current_size:
                        current_size = entry["dimensions"]["width"]
                        current_url = entry["file"]
        except KeyError:
            return None

        return current_url

    @staticmethod
    def validate_capi_content(capi_content: dict):
        """
        checks if the passed dictionary has the keys we need to treat it as a capi record
        :param capi_content:
        :return: the contents of the response.content keys if it's valid or None if its not.
        """
        if "response" not in capi_content or "content" not in capi_content["response"]:
            return None

        if "atoms" not in capi_content["response"]["content"] or "media" not in capi_content["response"]["content"]["atoms"]:
            return None

        if not isinstance(capi_content["response"]["content"]["atoms"]["media"], list):
            return None

        return capi_content["response"]["content"]

    @staticmethod
    def find_deliverable_url_for_id(atom_id: str):
        try:
            assets = DeliverableAsset.objects.filter(atom_id=atom_id)
            if len(assets) == 0:
                return None
            elif len(assets) > 0:
                logger.warning("There are {0} assets associated with atom id {1}, using the first", len(assets),
                               atom_id)

            return "/item/{0}".format(assets[0].id)

        except DeliverableAsset.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        if not hasattr(settings, "CAPI_KEY"):
            return Response({"status": "error", "detail": "You need to set capi_key in the settings"}, status=500)
        if not hasattr(settings, "CAPI_BASE"):
            return Response({"status": "error", "detail": "You need to set capi_base in the settings"}, status=500)
        if "url" not in request.GET:
            return Response({"status": "error", "detail": "No url= parameter"}, status=500)

        try:
            unquoted_url = urllib.parse.unquote(request.GET["url"])
            parsed_url = urllib.parse.urlparse(unquoted_url)
            url_to_call = "https://{base}{0}?api-key={key}&show-atoms=media".format(parsed_url.path,
                                                                                    base=settings.CAPI_BASE,
                                                                                    key=settings.CAPI_KEY)
            logger.info("CAPI url for {0} is {1}".format(request.GET["url"], url_to_call))
            response = requests.get(url_to_call)
            logger.info("CAPI response was {0}".format(response.status_code))
            if response.status_code == 200:
                capi_content = self.validate_capi_content(response.json())
                if capi_content is None:
                    logger.error(
                        "CAPI did not return enough fields that we wanted. Consult deliverables_dash_views.py for details on what's needed. We got: {0}.".format(
                            response.text))
                    return Response({
                        "status": "capi_response_error",
                        "detail": "This does not seem to be a video atom"
                    })
                elif len(capi_content["atoms"]["media"]) == 0:
                    logger.error("CAPI did not return any media atoms in the page. We got: {0}".format(response.text))
                    return Response({
                        "status": "capi_response_error",
                        "detail": "There were no video atoms on the page"
                    })
                else:
                    return Response({
                        "status": "ok",
                        "webTitle": capi_content["webTitle"],
                        "atoms": [{
                            "atomTitle": atom["title"],
                            "atomId": atom["id"],
                            "image": self.find_smallest_poster(atom),
                            "deliverable": self.find_deliverable_url_for_id(atom["id"])
                        } for atom in capi_content["atoms"]["media"]]
                    })
            else:
                logger.error("Could not access {0}: CAPI returned {1} {2}".format(url_to_call, response.status_code,
                                                                                  response.text))
                return Response({
                    "status": "capi_response_error",
                    "detail": "CAPI returned {0}".format(response.status_code)
                })
        except Exception as e:
            logger.error("Could not make proxy request to CAPI: {0}".format(str(e)))
            return Response({"status": "error", "detail": "See server logs"}, status=500)


class PublicationDatesSummary(APIView):
    renderer_classes = (NumpyJSONRenderer,)
    authentication_classes = (JwtRestAuth, BasicAuthentication, SessionAuthentication)
    permission_classes = (IsAuthenticated,)

    # with thanks to https://stackoverflow.com/questions/8746014/django-group-by-date-day-month-year
    @staticmethod
    def build_dataset(queryset, start_date:datetime, end_date:datetime) -> dict:
        """
        builds a dictionary that contains the "bucketed aggregate" information for the given queryset.
        We ask the database to give us the total count for each day value within the date range provided
        and return this as a dictionary with a key "day" for the date and "count" for the count
        :param queryset: base queryset to aggregate
        :param start_date: datetime indicating the earliest result to return
        :param end_date: datetime indicating the latest result to return
        :return: a dictionary of data
        """
        return queryset.filter(publication_date__gte=start_date, publication_date__lte=end_date). \
            annotate(day=TruncDay("publication_date")). \
            order_by("day"). \
            values("day"). \
            annotate(count=Count("id"))

    @staticmethod
    def invert_data(raw_response:dict, start_date:datetime, end_date: datetime) -> dict:
        """
        the data from the database contains a list of dates for each platform.
        the graph requires a list of platforms for each date.
        :param raw_response: raw aggregation response from the database
        :param start_date: starting date of the requested range
        :param end_date: ending date of the requested range
        :return: a dictionary of data
        """
        current_date = start_date
        day_count = (end_date - start_date).total_seconds() / (3600*24)
        logger.debug("day_count is {0}".format(day_count))
        platform_count = len(raw_response.keys())
        i=0

        content = {
            "dates": numpy.empty(int(day_count), dtype=datetime),
            "platforms": numpy.empty(platform_count, dtype=object)
        }

        #set up date index
        while True:
            content["dates"][i] = current_date.isoformat("T")
            i += 1
            current_date = current_date + timedelta(days=1)
            if current_date > end_date:
                break

        i = 0
        for platform, entries in raw_response.items():
            content["platforms"][i] = {
                "name": platform,
                "data": numpy.zeros(day_count, dtype=numpy.int)
            }
            entry_count = len(entries)
            dest_ctr = 0
            src_ctr  = 0
            current_date = start_date
            while src_ctr<entry_count and dest_ctr<day_count:
                if entries[src_ctr]["day"] == current_date:
                    content["platforms"][i]["data"][dest_ctr] = entries[src_ctr]["count"]
                    src_ctr += 1
                else:
                    content["platforms"][i]["data"][dest_ctr] = 0
                dest_ctr += 1
                current_date = current_date + timedelta(days=1)
            i += 1
        return content

    def get(self, request):
        from django.utils import timezone
        try:
            end_date = timezone.make_aware(datetime.now())
            start_date = end_date.replace(day=1, hour=23, minute=59, second=59, microsecond=999)
            if "startDate" in self.request.GET:
                try:
                    start_date = timezone.make_aware(parse_date(self.request.GET["startDate"]))
                except Exception as err:
                    logger.warning("Could not parse provided string {0} as a date: {1}".format(start_date, err))
            if "endDate" in self.request.GET:
                try:
                    end_date = timezone.make_aware(parse_date(self.request.GET["endDate"]))
                except Exception as err:
                    logger.warning("Could not parse provided string {0} as a date: {1}".format(end_date, err))

            data = self.invert_data({
                "gnm_website": self.build_dataset(GNMWebsite.objects.all(), start_date, end_date),
                "youtube": self.build_dataset(Youtube.objects.all(), start_date, end_date),
                "dailymotion": self.build_dataset(DailyMotion.objects.all(), start_date, end_date),
                "mainstream": self.build_dataset(Mainstream.objects.all(), start_date, end_date)
            }, start_date, end_date)

            return Response(data)
        except Exception as err:
            logger.exception("Could not compute data aggregation: ", err)
            return Response({"status": "error", "detail": str(err)}, status=500)
