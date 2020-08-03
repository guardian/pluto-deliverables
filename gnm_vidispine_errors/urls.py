"""
URLS for the Vidispine error handling plugin
"""

from django.urls import path
from .views import ErrorView


urlpatterns = [
    path(r'^(?P<status_code>\d+)/(?P<vidispine_path>.*)/$', ErrorView, name='vidispine_error'),
]
