from pprint import pprint
from django.conf import settings


class DeploymentRouteRedirector:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        #pprint(response.__dict__)

        if "location" in response:
            base = settings.DEPLOYMENT_ROOT
            if base[-1] == "/":
                base = base[:-2]

            print("old location is {}".format(response["location"]))
            response["location"] = base + response["location"]
            print("new location is {}".format(response["location"]))

        return response