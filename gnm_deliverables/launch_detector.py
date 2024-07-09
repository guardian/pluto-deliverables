import logging
import jsonschema
import datetime
import dateutil.parser
from typing import List
from .models import *
import re
import pytz

logger = logging.getLogger(__name__)


class InlineChangeRecord(object):
    """
    Represents an individual change record
    """
    def __init__(self, initial_data):
        self._content = initial_data
    timestamp_splitter = re.compile(r'\[.*]$')

    @property
    def user(self):
        return self._content.get("user", None)

    @property
    def at(self) -> datetime.datetime:
        # "at" parameter is mandatory
        string_to_parse = self.timestamp_splitter.sub("",self._content["at"])
        return dateutil.parser.isoparse(string_to_parse)


class YTMeta(object):
    """
    Represents the youtube-specific metadata within an atom
    """
    def __init__(self, initial_data):
        self._content = initial_data

    @property
    def is_valid(self):
        return "categoryId" in self._content and \
            "channelId" in self._content and \
            "privacyStatus" in self._content

    @property
    def category_id(self):
        return self._content.get("categoryId", None)

    @property
    def channel_id(self):
        return self._content.get("channelId", None)

    @property
    def expiry_date(self):
        if "expiryDate" in self._content:
            return dateutil.parser.isoparse(self._content["expiryDate"])
        else:
            return None

    @property
    def keywords(self):
        return self._content.get("keywords", None)

    @property
    def privacy_status(self):
        return self._content.get("privacyStatus", None)

    @property
    def license(self):
        return self._content.get("license", None)

    @property
    def title(self):
        return self._content.get("title","")

    @property
    def description(self):
        return self._content.get("description", "")


class MediaAsset(object):
    """
    Represents the individual media assets present within an atom/
    Note that the accessors apart from mime_type are unsafe, since this assumes
    that the object is constructed from pre-validated data.
    """
    def __init__(self, initial_data):
        self._content = initial_data

    @property
    def mime_type(self):
        return self._content.get("maybeMimeType", None)

    @property
    def asset_type(self):
        return self._content["assetType"]

    @property
    def platform(self):
        return self._content["platform"]

    @property
    def asset_id(self):
        return self._content["platformId"]

    @property
    def version(self):
        return self._content["version"]


class LaunchDetectorUpdate(object):
    schema = {
        "type": "object",
        "$schema": "http://json-schema.org/draft-07/schema#",
        "properties": {
            "title": {"type": "string"},
            "category":{"type": "string"},
            "atomId":{"type":"string"},
            "duration":{"type": ["number", "null"]},
            "source":{"type": ["string", "null"]},
            "description":{"type": ["string", "null"]},
            "posterImage": {
                "type": ["object", "null"],
                "properties": {
                    "mimeType": {"type": ["string", "null"]},
                    "file": {"type": "string"},
                    "credit": {"type": ["string", "null"]},
                    "copyright": {"type": ["string", "null"]},
                    "source": {"type": ["string", "null"]},
                    "mediaId": {"type": ["string", "null"]},
                }
            },
            "trailtext":{"type": ["string", "null"]},
            "byline": {
                "type": ["array", "null"],
                "items": {
                    "type": "string"
                }
            },
            "keywords": {
                "type": ["array", "null"],
                "items": {
                    "type": "string"
                }
            },
            "trailImage": {
                "type": ["object", "null"],
                "properties": {
                    "mimeType": {"type": ["string", "null"]},
                    "file": {"type": "string"},
                    "credit": {"type": ["string", "null"]},
                    "copyright": {"type": ["string", "null"]},
                    "source": {"type": ["string", "null"]},
                    "mediaId": {"type": ["string", "null"]},
                }
            },
            "commissionId":{"type": ["string", "null"]},
            "projectId":{"type": ["string", "null"]},
            "masterId":{"type": ["string", "null"]},
            "published":{
                "type": ["object", "null"],
                "properties": {
                    "user": {"type": ["string", "null"]},
                    "at": {"type": "string"}    ##ISO date string
                }
            },
            "lastModified":{
                "type": ["object", "null"],
                "properties": {
                    "user": {"type": ["string", "null"]},
                    "at": {"type": "string"}    ##ISO date string
                }
            },
            "assets": {
                "type": ["array"],
                "items": {
                    "type": "object",
                    "properties": {
                        "maybeMimeType": {"type":["string","null"]},
                        "assetType": {"type":"string"},
                        "platform":{"type":"string"},
                        "platformId":{"type":"string"},
                        "version":{"type":"number"}
                    }
                }
            },
            "ytMeta": {
                "type": ["object","null"],
                "properties": {
                    "title": {"type": ["string","null"]},
                    "description": {"type": ["string", "null"]},
                    "categoryId": {"type":["string","null"]},
                    "channelId": {"type":["string","null"]},
                    "expiryDate": {"type":["string","null"]},   #ISO date string
                    "keywords": {
                        "type": ["array","null"],
                        "items": {
                            "type": "string"
                        }
                    },
                    "privacyStatus": {"type":["string","null"]},
                    "license": {"type":["string","null"]},
                }
            }
          },
        }

    def __init__(self, raw_content: dict):
        """
        initialise from predetermined data. Raises a ValidationError if the data is not right.
        :param raw_content:
        """
        jsonschema.validate(raw_content, schema=self.schema)
        self._content = raw_content

    @property
    def title(self):
        return self._content.get("title", None)

    @property
    def category(self):
        return self._content.get("category", None)

    @property
    def atom_id(self):
        return self._content.get("atomId", None)

    @property
    def duration(self):
        longval: int = self._content.get("duration", None)
        if longval is None:
            return None
        else:
            return datetime.timedelta(longval)

    @property
    def source(self):
        return self._content.get("source", None)

    @property
    def description(self):
        return self._content.get("description", None)

    @property
    def poster_image(self):
        return self._content.get("posterImage", None)

    @property
    def trail_text(self):
        return self._content.get("trailText", None)

    @property
    def byline(self):
        return self._content.get("byline", None)

    @property
    def keywords(self):
        return self._content.get("keywords", None)

    @property
    def trail_image(self):
        return self._content.get("trailImage", None)

    @property
    def commission_id(self):
        return self._content.get("commissionId", None)

    @property
    def project_id(self):
        return self._content.get("projectId", None)

    @property
    def master_id(self):
        return self._content.get("masterId", None)

    @property
    def published(self):
        raw_data = self._content.get("published", None)
        if raw_data is None:
            return None
        else:
            return InlineChangeRecord(raw_data)

    @property
    def last_modified(self):
        raw_data = self._content.get("lastModified", None)
        if raw_data is None:
            return None
        else:
            return InlineChangeRecord(raw_data)

    @property
    def assets(self) -> List[MediaAsset]:
        return [MediaAsset(entry) for entry in self._content.get("assets")]

    @property
    def yt_meta(self) -> YTMeta:
        return YTMeta(self._content.get("ytMeta"))


def find_asset_for(msg: LaunchDetectorUpdate) -> DeliverableAsset:
    """
    look up the DeliverableAsset for the given item. If none is found, then DeliverableAsset.DoesNotExist is raised
    :param msg: LaunchDetectorMessage containing the incoming update
    :return: DeliverableAsset instance
    """
    matches = DeliverableAsset.objects.filter(atom_id=msg.atom_id)
    if len(matches) == 0:
        raise DeliverableAsset.DoesNotExist
    elif len(matches) > 1:
        logger.warning("Found {0} potential matches for atom id {1}, using the first".format(matches, msg.atom_id))

    return matches[0]


def zoned_datetime() -> datetime:
    """
    Outputs a datetime value with the correct time zone.
    The configured timezone from the settings is applied to the resulting DateTime. If no timezone is configured,
    then we default to UTC and emit a warning
    :return: the timezone-aware datetime
    """
    from django.conf import settings

    tz = pytz.timezone("UTC")
    aware_utc_dt = tz.localize(datetime.datetime.now())
    if hasattr(settings, "TIME_ZONE"):
        server_tz = pytz.timezone(settings.TIME_ZONE)
        return aware_utc_dt.astimezone(server_tz)

    else:
        logger.warning("TIME_ZONE is not configured in the settings, defaulting to UTC")
        return aware_utc_dt


def update_gnmwebsite(msg: LaunchDetectorUpdate, asset: DeliverableAsset):
    """
    either create or update a gnmwebsite information object from the given message.
    saves the gnmwebsite record to the database but NOT the DeliverableAsset.
    :param msg: LaunchDetectorUpdate instance giving the content to update
    :param asset: DeliverableAsset that needs to be updated.
    :return:
    """
    if asset.gnm_website_master is None:
        rec: GNMWebsite = GNMWebsite(publication_status='Unpublished')
    else:
        rec: GNMWebsite = asset.gnm_website_master

    #commented out fields are not currently provided by LD
    rec.media_atom_id = msg.atom_id
    #rec.production_office = msg.
    rec.website_description = msg.description
    rec.website_title = msg.title
    rec.tags = msg.keywords
    rec.primary_tone = msg.category
    if msg.published is not None:
        rec.publication_date = msg.published.at
        rec.publication_status = 'Published'
    # set the etag in case something else is editing it at the moment
    rec.etag = zoned_datetime().isoformat('T')
    rec.source = msg.source

    asset.gnm_website_master = rec  #no-op if it was already set like this
    rec.save()
    asset.save()


def update_dailymotion(msg: LaunchDetectorUpdate, asset: DeliverableAsset):
    """
    either create or update a dailymotion information object from the given message
    :param msg: LaunchDetectorUpdate instance giving the content to update
    :param asset: DeliverableAsset that needs to be updated.
    :return:
    """
    if asset.DailyMotion_master is None:
        rec: DailyMotion = DailyMotion()
    else:
        rec: DailyMotion = asset.DailyMotion_master

    #would be good to build a mapping table for this
    #rec.daily_motion_category
    if rec.daily_motion_description is None or rec.daily_motion_description == "":
        rec.daily_motion_description = msg.description
    if rec.daily_motion_tags is None or len(rec.daily_motion_tags) == 0:
        #would be good to map these to names
        rec.daily_motion_tags = msg.keywords
    if rec.daily_motion_title is None or rec.daily_motion_title=="":
        rec.daily_motion_title = msg.title
    if rec.daily_motion_no_mobile_access is None:
        rec.daily_motion_no_mobile_access = False
    if rec.daily_motion_contains_adult_content is None:
        rec.daily_motion_contains_adult_content = False

    # set the etag in case something else is editing it at the moment
    rec.etag = zoned_datetime().isoformat('T')

    asset.DailyMotion_master = rec  #no-op if it was already set like this
    rec.save()
    asset.save()


def update_mainstream(msg: LaunchDetectorUpdate, asset: DeliverableAsset):
    """
    either create or update a Mainstram information object from the given message
    :param msg: LaunchDetectorUpdate instance giving the content to update
    :param asset: DeliverableAsset that needs to be updated.
    :return:
    """
    if asset.mainstream_master is None:
        rec: Mainstream = Mainstream()
    else:
        rec: Mainstream = asset.mainstream_master

    if rec.mainstream_description is None or rec.mainstream_description=="":
        rec.mainstream_description = msg.description
    if rec.mainstream_title is None or rec.mainstream_title=="":
        rec.mainstream_title = msg.title
    if rec.mainstream_tags is None or len(rec.mainstream_tags)==0:
        rec.mainstream_tags = msg.keywords
    if rec.mainstream_rules_contains_adult_content is None:
        rec.mainstream_rules_contains_adult_content = False

    # set the etag in case something else is editing it at the moment
    rec.etag = zoned_datetime().isoformat('T')

    asset.mainstream_master = rec  #no-op if it was already set like this
    rec.save()
    asset.save()


def update_youtube(msg: LaunchDetectorUpdate, asset: DeliverableAsset):
    """
    either create or update a Youtube information object from the given message
    :param msg:  LaunchDetectorUpdate instance giving the content to update
    :param asset: DeliverableAsset that needs to be updated
    :return:
    """
    if asset.youtube_master is None:
        rec: Youtube = Youtube()
    else:
        rec: Youtube = asset.youtube_master

    # FIXME: should update our data model to handle multiple assets on a given item, then we can remove this.
    youtube_assets = [a for a in msg.assets if a.platform.lower() == "youtube"]
    # sort is lowest-number first, we want the highest so take last of the list
    youtube_assets_sorted: List[MediaAsset] = sorted(youtube_assets, key=lambda a: a.version)

    if len(youtube_assets_sorted) > 0:
        rec.youtube_id = youtube_assets_sorted[-1].asset_id

    if msg.yt_meta:
        rec.youtube_category = msg.yt_meta.category_id
        rec.youtube_channel = msg.yt_meta.channel_id
        rec.youtube_tags = msg.yt_meta.keywords
        if msg.yt_meta.title != "":
            rec.youtube_title = msg.yt_meta.title
        if msg.yt_meta.description != "":
            rec.youtube_description = msg.yt_meta.description
    if msg.published is not None:
        rec.publication_date = msg.published.at
    # set the etag in case something else is editing it at the moment
    rec.etag = zoned_datetime().isoformat('T')
    asset.youtube_master = rec
    rec.save()
    asset.save()

