from django.core.management.base import BaseCommand
from gnm_deliverables.models import DeliverableAsset
from pprint import pprint
import logging
from django.db.models import Count
from gnm_deliverables.choices import DELIVERABLE_ASSET_STATUSES_DICT

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    Management command to remove duplicate deliverable assets
    """
    help = 'Remove duplicate deliverable assets'

    def handle(self, *args, **options):
        pprint(options)

        paths_with_issue = DeliverableAsset.objects.values('absolute_path').annotate(Count('id')).order_by().filter(id__count__gt=1)

        if len(paths_with_issue) > 0:
            for path in paths_with_issue:
                print ("\n Duplicates found with path: {0}".format(path['absolute_path']))
                assets_with_issue_weighted = []
                assets_with_issue = DeliverableAsset.objects.filter(absolute_path=path['absolute_path'])
                for asset in assets_with_issue:
                    print("\n Id.: {0}".format(asset.id))
                    print("Name: {0}".format(asset.filename))
                    print("Size: {0}".format(asset.size))
                    print("Version: {0}".format(asset.version))
                    assets_with_issue_weighted.append([asset.id, asset.size, asset.version, asset.online_item_id, DELIVERABLE_ASSET_STATUSES_DICT.get(asset.status), 0])
                if path['absolute_path'] != '':
                    # Set score depending on status
                    for asset in assets_with_issue_weighted:
                        if asset[4] == "Ingested":
                            asset[5] = 50
                        if asset[4] == "Ingest failed":
                            asset[5] = -20
                        if asset[4] == "Transcode Failed":
                            asset[5] = -20
                    # Add 2 to the score of the item with the first id.
                    id_numbers = []
                    for asset in assets_with_issue_weighted:
                        id_numbers.append(asset[0])
                    index_of_first_id = id_numbers.index(min(id_numbers))
                    assets_with_issue_weighted[index_of_first_id][5] = assets_with_issue_weighted[index_of_first_id][5] + 2
                    # Remove 5 from the score of items with no file size
                    for asset in assets_with_issue_weighted:
                        if asset[1] == 0:
                            asset[5] = asset[5] - 5
                    # Add 40 to the score of items with an online item id.
                    for asset in assets_with_issue_weighted:
                        if asset[3] is not None:
                            asset[5] = asset[5] + 40
                    # Sort the list by score
                    assets_with_issue_weighted.sort(key=lambda x: x[5], reverse=True)
                    pprint(assets_with_issue_weighted)
                    first_item = True
                    for asset in assets_with_issue_weighted:
                        if first_item:
                            first_item = False
                            continue
                        print("Attempting to delete item: {0}".format(asset[0]))
                        DeliverableAsset.objects.filter(id=asset[0]).delete()
                else:
                    print("Blank path so skipping removal.")
        else:
            print("No duplicates.")
