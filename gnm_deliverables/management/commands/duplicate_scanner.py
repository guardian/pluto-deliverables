from django.core.management.base import BaseCommand
import csv
from gnm_deliverables.models import DeliverableAsset
from pprint import pprint
import logging
from django.db.models import Count
from gnm_deliverables.choices import DELIVERABLE_ASSET_STATUSES_DICT

logging.basicConfig(level=logging.DEBUG)

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Management command to generate a CSV file of duplicate deliverable assets
    """
    help = 'Generate a CSV file of duplicate deliverable assets'

    def add_arguments(self, parser):
        parser.add_argument("--output", type=str, default="report.csv", help="Location to output a CSV report")

    def handle(self, *args, **options):
        pprint(options)

        output_file_path = options["output"]

        paths_with_issue = DeliverableAsset.objects.values('absolute_path').annotate(Count('id')).order_by().filter(id__count__gt=1)

        with open(output_file_path, "w") as f:
            writer = csv.writer(f, dialect=csv.excel)
            writer.writerow(["Id.", "Path", "Filename", "Type", "Size", "Version", "Job Id.", "Online Item Id.", "Duration in Seconds", "Atom Id.", "Status"])

            if len(paths_with_issue) > 0:
                for path in paths_with_issue:
                    print ("\n Duplicates found with path: {0}".format(path['absolute_path']))

                    assets_with_issue = DeliverableAsset.objects.filter(absolute_path=path['absolute_path'])
                    for asset in assets_with_issue:
                        print("\n Id.: {0}".format(asset.id))
                        print("Name: {0}".format(asset.filename))
                        print("Size: {0}".format(asset.size))
                        print("Version: {0}".format(asset.version))
                        writer.writerow([asset.id, asset.absolute_path, asset.filename, asset.type_string, asset.size, asset.version, asset.job_id, asset.online_item_id, asset.duration_seconds, asset.atom_id, DELIVERABLE_ASSET_STATUSES_DICT.get(asset.status)])
            else:
                print("No duplicates")
