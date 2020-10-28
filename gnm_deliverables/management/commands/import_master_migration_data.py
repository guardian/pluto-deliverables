from django.core.management.base import BaseCommand
import yaml
import logging
from pprint import pprint
from gnm_deliverables.models import *
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    management command to import a yaml dump from the master migration process
    """
    help = "import a yaml dump from the master migration process"

    def add_arguments(self, parser):
        parser.add_argument("path",type=str,help="path to the yaml file to import")
        parser.add_argument("--commissions",type=str,help="path to a yaml file containing project_id->commission_id relations")

    def load_content(self, fromFile:str) -> list:
        with open(fromFile, "r") as f:
            loaded_content = yaml.safe_load(f.read())
            if not isinstance(loaded_content, list):
                pprint(loaded_content)
                raise TypeError("File content should be a list, not a {}".format(loaded_content.__class__.__name__))
            return loaded_content

    def load_commissions_table(self, fromFile:str) -> dict:
        with open(fromFile, "r") as f:
            loaded_content = yaml.safe_load(f.read())
            if not isinstance(loaded_content, dict):
                pprint(loaded_content)
                raise TypeError("File content should be an object, not a {}".format(loaded_content.__class__.__name__))
            return loaded_content

    def handle(self, *args, **options):
        commissions_table = self.load_commissions_table(options["commissions"])
        logger.info("Loaded {} project->commission relations from {}".format(len(commissions_table), options["commissions"]))
        content = self.load_content(options["path"])

        logger.info("Loaded {} items from {}".format(len(content), options["path"]))

        for entry in content:
            parent_project_id = entry["deliverable"]
            del entry["deliverable"]

            #remove blank entries from some fields - e.g. date-time and uuids, things that need parsing.
            #go returns a blank when we actually want a null
            for name in ["access_dt", "modified_dt", "changed_dt", "job_id", "ingest_complete_dt", "atom_id"]:
                if name in entry and entry[name]=="":
                    del entry[name]

            # project_id = models.CharField(null=True, blank=True, max_length=61)
            # commission_id = models.BigIntegerField(null=False, blank=False, db_index=True)
            # pluto_core_project_id = models.BigIntegerField(null=False, blank=False, db_index=True, unique=True)
            # name = models.CharField(null=False, blank=False, unique=True, max_length=255)
            # created = models.DateTimeField(null=False, blank=False, auto_now_add=True)
            parent_deliverable_bundle, parent_bundle_created = Deliverable.objects.get_or_create(pluto_core_project_id=parent_project_id, defaults={
                "commission_id": commissions_table.get(parent_project_id),
                "pluto_core_project_id": parent_project_id,
                "name": "Legacy masters for {}".format(parent_project_id),
            })

            if parent_bundle_created:
                logger.info("created new parent bundle for project id {}".format(parent_project_id))
                parent_deliverable_bundle.save()
            else:
                logger.info("using existing bundle {}".format(parent_deliverable_bundle.id))

            if "gnm_website_master" in entry and entry["gnm_website_master"] is not None:
                if entry["gnm_website_master"].get("media_atom_id")=="":
                    del entry["gnm_website_master"]["media_atom_id"]
                for name in ["publication_date", "etag"]:
                    if entry["gnm_website_master"].get(name) == "":
                        del entry["gnm_website_master"][name]
                entry["gnm_website_master"] = GNMWebsite(**entry["gnm_website_master"])
                entry["gnm_website_master"].save()
            else:
                entry["gnm_website_master"] = None

            if "youtube_master" in entry and entry["youtube_master"] is not None:
                for name in ["publication_date", "etag"]:
                    if entry["youtube_master"].get(name) == "":
                        del entry["youtube_master"][name]
                entry["youtube_master"] = Youtube(**entry["youtube_master"])
                entry["youtube_master"].save()
            else:
                entry["youtube_master"] = None

            if "mainstream_master" in entry and entry["mainstream_master"] is not None:
                for name in ["publication_date", "etag"]:
                    if entry["mainstream_master"].get(name) == "":
                        del entry["mainstream_master"][name]
                entry["mainstream_master"] = Mainstream(**entry["mainstream_master"])
                entry["mainstream_master"].save()
            else:
                entry["mainstream_master"] = None

            if "DailyMotion_master" in entry and entry["DailyMotion_master"] is not None:
                for name in ["publication_date", "etag"]:
                    if entry["DailyMotion_master"].get(name) == "":
                        del entry["DailyMotion_master"][name]
                entry["DailyMotion_master"] = DailyMotion(**entry["DailyMotion_master"])
                entry["DailyMotion_master"].save()
            else:
                entry["DailyMotion_master"] = None

            newrec = DeliverableAsset(**entry)
            legacy_item_id = newrec.online_item_id

            #check for existing items
            existing_item_check = DeliverableAsset.objects.filter(absolute_path=newrec.absolute_path, size=newrec.size,filename=newrec.filename).count()
            if existing_item_check>0:
                logger.info("Legacy item {} already exists with {} copies, not duplicating".format(legacy_item_id, existing_item_check))
                continue

            newrec.online_item_id = None
            newrec.deliverable = parent_deliverable_bundle
            newrec.save()
            logger.info("Legacy item {} imported to {}".format(legacy_item_id, newrec.pk))