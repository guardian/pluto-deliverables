from django.core.management.base import BaseCommand
from gnm_deliverables.models import Deliverable, DeliverableAsset
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """
    management command that will find multiple entries for a single project and coalesce them down to 1
    """
    def distinct_project_ids(self):
        """
        obtains all of the unique project id values
        :return:  a list of dict entries in the form `{"pluto_core_project_id": {numeric-id}}`
        """
        return list(Deliverable.objects.order_by().values("pluto_core_project_id").distinct())

    def merge_bundles(self, pluto_project_id):
        """
        try to merge up all the bundles for the given project id
        :param pluto_project_id:
        :return:
        """
        affected_bundles = list(Deliverable.objects.filter(pluto_core_project_id=pluto_project_id)) #convert generator to list immediately

        merge_target:Deliverable = affected_bundles[0]
        merge_sources:list= affected_bundles[1:]

        merge_source_titles = [b.name for b in merge_sources]

        logger.info("Merging bundles {0} onto bundle {1}".format(merge_source_titles, merge_target.name))

        for merge_source in merge_sources:
            source_bundle_assets = DeliverableAsset.objects.filter(deliverable=merge_source)
            logger.info("\tBundle {0} has {1} deliverables to move".format(merge_source.name, len(source_bundle_assets)))
            for asset in source_bundle_assets:
                asset.deliverable = merge_target
                asset.save()
            #double-check that data has moved
            remaining_assets_count = DeliverableAsset.objects.filter(deliverable=merge_source).count()
            if remaining_assets_count>0:
               raise RuntimeError("we thought we had moved everything for {0} {1} but there were {2} assets remaining!".format(merge_source.pk, merge_source.name, remaining_assets_count))
            merge_source.delete()

        final_asset_count = DeliverableAsset.objects.filter(deliverable=merge_target).count()
        logger.info("Finished processing {0}. New deliverable count is {1}".format(merge_target.name, final_asset_count))

    def handle(self, *args, **opts):
        all_known_project_ids = self.distinct_project_ids()

        logger.info("A total of {0} project ids are registered with deliverable bundles".format(len(all_known_project_ids)))

        for target_project_id in all_known_project_ids:
            project_bundles_count = Deliverable.objects.filter(pluto_core_project_id=target_project_id["pluto_core_project_id"]).count()
            logger.debug("Project id {} has {} associated bundles".format(target_project_id["pluto_core_project_id"], project_bundles_count))

            if project_bundles_count>1:
                self.merge_bundles(target_project_id["pluto_core_project_id"])