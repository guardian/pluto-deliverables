import logging
import jsonschema
import datetime
import dateutil.parser
from .models import *

logger = logging.getLogger(__name__)


class InlineChangeRecord(object):
    def __init__(self, initial_data):
        self._content = initial_data

    @property
    def user(self):
        return self._content.get("user", None)

    @property
    def at(self) -> datetime.datetime:
        # "at" parameter is mandatory
        return dateutil.parser.isoparse(self._content["at"])


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
    if rec.daily_motion_description is None or rec.daily_motion_description=="":
        rec.daily_motion_description = msg.description
    if rec.daily_motion_tags is None or rec.daily_motion_tags.size==0:
        #would be good to map these to names
        rec.daily_motion_tags = msg.keywords
    if rec.daily_motion_title is None or rec.daily_motion_title=="":
        rec.daily_motion_title = msg.title

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
    if rec.mainstream_tags is None or rec.mainstream_tags.size==0:
        rec.mainstream_tags = msg.keywords

    rec.save()
    asset.save()

## YouTube should be set up based on the information coming from the Media Atom tool directly, in the rabbitmq handler.