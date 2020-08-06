from django.apps import AppConfig
import os

class GnmDeliverablesConfig(AppConfig):
    name = 'gnm_deliverables'

    def ready(self):
        if not "CI" in os.environ:
            #importing the signals here makes the system set them up. Don't remove this as an un-used import!
            from .signals import model_deleted, model_saved
        print("we started up!")
