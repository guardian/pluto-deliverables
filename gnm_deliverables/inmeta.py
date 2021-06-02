from .models import DeliverableAsset
import xml.etree.cElementTree as ET
import os.path
import logging
import re
from datetime import datetime
logger = logging.getLogger(__name__)


def field(parent:ET.Element,name:str,value:str):
    """
    private function to output a single meta line
    :param parent:
    :param name:
    :param value:
    :return:
    """
    valueToOutput = value
    if valueToOutput is None:
        valueToOutput = ""

    ET.SubElement(parent,"meta",{"name":name,"value":valueToOutput})


def find_free_filepath(output_dir:str, filebase:str)->str:
    """
    finds the first non-existing filepath
    :param output_dir:
    :param filebase:
    :return:
    """
    i=0
    while True:
        if i==0:
            prefix = ""
        else:
            prefix = "{0}-".format(i)
        filepath = os.path.join(output_dir, "{0}{1}.inmeta".format(prefix,filebase))
        if not os.path.exists(filepath):
            return filepath
        i+=1


def inmeta_to_string(asset:DeliverableAsset, platform:str)->str:
    content = make_doc(asset, platform)

    if content is None:
        logger.error("Could not make content doc?")
        raise RuntimeError("Could not make content doc")

    if asset.online_item_id:
        safe_filename = asset.online_item_id
    elif asset.nearline_item_id:
        safe_filename = asset.nearline_item_id
    else:
        safe_filename = re.sub(r'\s+',"_", asset.filename)

    if safe_filename == "":
        logger.error("Could not determine a filename for asset {0} - no online id, nearline id or filename available!".format(asset.id))
        raise ValueError("Could not determine a filename")

    xml_content = ET.tostring(content, "UTF-8")
    if isinstance(xml_content, bytes):
        return xml_content.decode("UTF-8")
    else:
        return xml_content


def make_doc(asset:DeliverableAsset, platform:str) -> ET.Element:
    """
    create an ElementTree document that represents the given asset as inmeta
    :param asset: DeliverableAsset instance
    :return: populate ElementTree
    """
    rootEl = ET.Element("meta-data")

    moveInfoEl = ET.SubElement(rootEl, "meta-movie-info")
    ET.SubElement(moveInfoEl, "meta-movie", {"tokens":"format duration bitrate size tracks"})
    ET.SubElement(moveInfoEl, "meta-track", {"tokens": "type format start duration bitrate size"})
    ET.SubElement(moveInfoEl, "meta-video-track", {"tokens": "width height framerate"})
    ET.SubElement(moveInfoEl, "meta-audio-track", {"tokens": "channels bitspersample samplerate"})
    ET.SubElement(moveInfoEl, "meta-hint-track", {"tokens": "payload fmtp"})

    groupEl = ET.SubElement(rootEl, "meta-group", {"type":"movie meta"})
    field(groupEl, "itemId", asset.online_item_id)
    field(groupEl, "title", os.path.basename(asset.filename))
    field(groupEl, 'size', str(asset.size))
    if asset.changed_dt:
        timeString = asset.changed_dt.isoformat('T')
    else:
        timeString = datetime.now().isoformat("T")

    field(groupEl, "created", timeString)
    if asset.duration_seconds is not None:
        field(groupEl, "durationSeconds", str(asset.duration_seconds))
    if asset.version is not None:
        field(groupEl, "version", str(asset.version))
    field(groupEl, "pluto_deliverables_asset_id", str(asset.id))
    field(groupEl, "pluto_deliverables_project_id", str(asset.deliverable.pluto_core_project_id))
    field(groupEl, "pluto_deliverables_platform", platform)

    if asset.gnm_website_master:
        field(groupEl, "gnm_website_headline", asset.gnm_website_master.website_title)
        field(groupEl, "gnm_website_standfirst", asset.gnm_website_master.website_title)
        field(groupEl, "gnm_website_trail", asset.gnm_website_master.website_description)
        field(groupEl, "gnm_master_website_primary_tone", asset.gnm_website_master.primary_tone)
        #field(groupEl, "", asset.gnm_website_master.tags)
        field(groupEl, "gnm_master_generic_production_office", asset.gnm_website_master.production_office)
        field(groupEl, "gnm_master_website_publication_status", asset.gnm_website_master.publication_status)
        field(groupEl, "gnm_master_mediaatom_atomid", str(asset.gnm_website_master.media_atom_id))

    if asset.DailyMotion_master:
        if asset.DailyMotion_master.daily_motion_tags:
            kw = ",".join(asset.DailyMotion_master.daily_motion_tags)
            field(groupEl, "gnm_master_dailymotion_keywords", kw)
        field(groupEl, "gnm_master_dailymotion_owner", "The Guardian")
        field(groupEl, "gnm_master_dailymotion_status", asset.DailyMotion_master.upload_status)
        field(groupEl, "gnm_master_dailymotion_dailymotionurl", asset.DailyMotion_master.daily_motion_url)
        field(groupEl, "gnm_master_dailymotion_dailymotioncategory","{0}".format(asset.DailyMotion_master.daily_motion_category))
        field(groupEl, "gnm_master_dailymotion_author","The Guardian")
        field(groupEl, "gnm_master_dailymotion_description", asset.DailyMotion_master.daily_motion_description)
        field(groupEl, "gnm_master_dailymotion_title", asset.DailyMotion_master.daily_motion_title)
        field(groupEl, "gnm_master_dailymotion_uploadstatus", asset.DailyMotion_master.upload_status)
        field(groupEl, "gnm_master_dailymotion_nomobile", "{0}".format(asset.DailyMotion_master.daily_motion_no_mobile_access))
        field(groupEl, "gnm_master_dailymotion_adult_content", "{0}".format(asset.DailyMotion_master.daily_motion_contains_adult_content))

    if asset.mainstream_master:
        field(groupEl, "gnm_master_mainstreamsyndication_title", asset.mainstream_master.mainstream_title)
        if asset.mainstream_master.mainstream_tags:
            kw = ",".join(asset.mainstream_master.mainstream_tags)
            field(groupEl, "gnm_master_mainstreamsyndication_keywords", kw)
        field(groupEl, "gnm_master_mainstreamsyndication_description", asset.mainstream_master.mainstream_description)
        field(groupEl, "gnm_master_mainstreamsyndication_author", "The Guardian")
        field(groupEl, "gnm_master_mainstreamsyndication_publish", "")
        field(groupEl, "gnm_master_mainstreamsyndication_remove", "")
    return rootEl
