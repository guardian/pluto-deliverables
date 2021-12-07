import json
import numpy
from rest_framework.renderers import BaseRenderer, JSONRenderer


class NumpyEncoder(json.JSONEncoder):
    """
    Json encoder that can handle numpy arrays
    """
    def default(self, obj):
        if isinstance(obj, numpy.ndarray):
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)


class NumpyJSONRenderer(JSONRenderer):
    encoder_class = NumpyEncoder
