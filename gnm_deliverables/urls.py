"""
URLS for the Guardian Project plugin
"""

from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from gnm_deliverables.views.metadata_views import GNMWebsiteAPIView, YoutubeAPIView, DailyMotionAPIView,\
    MainstreamAPIView, PlatformLogsView
from django.contrib import admin
from gnm_deliverables.views.views import DeliverablesTypeListAPI, AdoptExistingVidispineItemView, VSNotifyView, \
    SetTypeView, TestCreateProxyView, NewDeliverablesAPIList, NewDeliverableAssetAPIList, DeliverableAPIView, \
    NewDeliverablesAPICreate, NewDeliverableAPIScan, NewDeliverableUI, CountDeliverablesView, NewDeliverablesApiGet, \
    DeliverableAPIStarted

urlpatterns = [
    path(r'admin/', admin.site.urls),
    path(r'api/bundle/<int:bundleId>/asset/<int:assetId>/setType', SetTypeView.as_view()),
    path(r'api/bundle/<int:bundleId>/asset/<int:assetId>/createProxy', TestCreateProxyView.as_view()),
    path(r'api/bundle/<int:bundleId>', NewDeliverablesApiGet.as_view()),
    path(r'api/bundle/new', NewDeliverablesAPICreate.as_view(), name='bundle-create'),
    path(r'api/bundle/scan', NewDeliverableAPIScan.as_view()),
    path(r'api/bundle/adopt', AdoptExistingVidispineItemView.as_view(), name="adopt-asset"),
    path(r'api/bundle', NewDeliverablesAPIList.as_view(), name="new-api-list"),
    path(r'api/deliverables', NewDeliverableAssetAPIList.as_view(), name="new-asset-list"),
    path(r'api/deliverable', DeliverableAPIView.as_view()),
    path(r'api/typeslist', DeliverablesTypeListAPI.as_view(), name="asset-types"),
    path(r'api/bundle/<int:project_id>/count', CountDeliverablesView.as_view()),
    path(r'api/notify/', csrf_exempt(VSNotifyView.as_view()), name="vs-notifications"),
    path(r'api/bundle/<str:project_id>/asset/<int:asset_id>/gnmwebsite', GNMWebsiteAPIView.as_view(), name="gnmwebsite"),
    path(r'api/bundle/<str:project_id>/asset/<int:asset_id>/mainstream', MainstreamAPIView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/youtube', YoutubeAPIView.as_view(), name='youtube'),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/dailymotion', DailyMotionAPIView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/<platform>/logs', PlatformLogsView.as_view()),
    path(r'api/bundle/started/<int:bundleId>', DeliverableAPIStarted.as_view()),
    re_path(r'^(?!api).*', NewDeliverableUI.as_view()),
]
