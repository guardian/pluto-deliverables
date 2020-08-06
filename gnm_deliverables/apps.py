from django.apps import AppConfig


class GnmDeliverablesConfig(AppConfig):
    name = 'gnm_deliverables'

    def ready(self):
        #importing the signals here makes the system set them up. Don't remove this as an un-used import!
        from .signals import model_deleted, model_saved
        print("we started up!")
