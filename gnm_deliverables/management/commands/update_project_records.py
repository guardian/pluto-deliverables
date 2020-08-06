# coding: utf-8
from django.core.management.base import BaseCommand
import re


class Command(BaseCommand):
    args = ''
    help = 'One-off upgrade of Deliverables models'

    def handle(self, *args, **options):
        from portal.plugins.gnm_deliverables.models import Deliverable
        from portal.plugins.gnm_projects.models import ProjectModel

        xtractor = re.compile(r'^(\w{2})-(\d+)$')

        total_updates = Deliverable.objects.filter(parent_project=None).count()
        print("Found {0} deliverables objects to update".format(total_updates))

        c=0
        for record in Deliverable.objects.filter(parent_project=None):
            parts = xtractor.match(record.project_id)
            if parts is None:
                print("ERROR: Deliverable record {0} for project {1} does not have a valid vidispine ID".format(record.pk, record.project_id))
                continue

            numeric_id = int(parts.group(2))
            try:
                record.parent_project = ProjectModel.objects.get(pk=numeric_id)
                record.save()
                c+=1
            except ProjectModel.DoesNotExist:
                print("ERROR: Project {0} does not have a django model associated with it".format(record.project_id))
                continue

        print("Update completed.  Updated {0} records out of {1}".format(c, total_updates))