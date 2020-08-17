# coding: utf-8
from django.core.management.base import BaseCommand
from django.urls import reverse
from gnmvidispine.vs_notifications import VSNotificationCollection, VSNotification, VSTriggerEntry, HttpNotification
import random
from time import sleep
from django.conf import settings
import xml.etree.cElementTree as ET

class Command(BaseCommand):
    args = ''
    help = 'Check that our notification is present in Vidispine and install it if not'

    our_notification_url = reverse("vs-notifications")

    def is_our_notification(self, notification:VSNotification):
        for action in notification.actions:
            try:
                if self.our_notification_url in action.url:
                    return True
            except VSNotification.UnknownActionType:
                pass
        return False

    def create_new_notification(self):
        triggerdoc = ET.Element("trigger", attrib={"xmlns": "http://xml.vidispine.com/schema/vidispine"})
        trigger = VSTriggerEntry(triggerdoc)
        trigger.trigger_class = "job"
        trigger.action = "stop"

        actiondoc = ET.Element("http", attrib={"xmlns":"http://xml.vidispine.com/schema/vidispine"})

        action = HttpNotification(actiondoc)
        action.url = settings.VS_CALLBACK_ROOT + self.our_notification_url
        action.method = "POST"
        action.contentType = "application/json"
        action.retry = 5
        action.synchronous = False
        action.timeout=10

        notif = VSNotification(url=settings.VIDISPINE_URL,user=settings.VIDISPINE_USER, passwd=settings.VIDISPINE_PASSWORD)
        notif.add_action(action)
        notif.trigger = trigger
        notif.objectclass = "job"

        print(notif.as_xml())
        print("Creating new notification to {}".format(action.url))
        notif.save()

    def handle(self, *args, **options):
        # seed with current time
        random.seed(a=None, version=2)

        # wait between 0 and 1 seconds, to try to minimise multiple adds
        sleeptime = random.randint(1,8)
        print("Waiting {0}s".format(sleeptime))
        sleep(sleeptime)
        print("Checking for notification {0}...".format(self.our_notification_url))
        print("Connecting to Vidispine at {0} as {1}...".format(settings.VIDISPINE_URL, settings.VIDISPINE_USER))

        job_notifs = VSNotificationCollection(url=settings.VIDISPINE_URL,user=settings.VIDISPINE_USER, passwd=settings.VIDISPINE_PASSWORD)

        already_existing = None

        for notification in job_notifs.notifications(objectclass="job"):
            if self.is_our_notification(notification):
                already_existing = notification
                break

        if already_existing:
            print("Found notification at {0}".format(already_existing.name))
        else:
            print("No existing notification found.")
            self.create_new_notification()