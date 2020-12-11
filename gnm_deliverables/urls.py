"""
URLS for the Guardian Project plugin
"""

from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from gnm_deliverables.views.metadata_views import GNMWebsiteAPIView, YoutubeAPIView, DailyMotionAPIView,\
    MainstreamAPIView, PlatformLogsView, TriggerOutputView, PlatformLogUpdateView, ResyncToPublished
from gnm_deliverables.views.views import DeliverablesTypeListAPI, AdoptExistingVidispineItemView, VSNotifyView, \
    SetTypeView, TestCreateProxyView, NewDeliverablesAPIList, NewDeliverableAssetAPIList, DeliverableAPIView, \
    NewDeliverablesAPICreate, NewDeliverableAPIScan, NewDeliverableUI, CountDeliverablesView, NewDeliverablesApiGet, \
    DeliverableAPIStarted, LaunchDetectorUpdateView, SearchForDeliverableAPIView, GenericAssetSearchAPI, NewDeliverabesApiBundleGet, \
    BundlesForCommission, RetryJobForAsset

urlpatterns = [
    path(r'api/asset/byFileName', SearchForDeliverableAPIView.as_view()),
    path(r'api/asset/search', GenericAssetSearchAPI.as_view(), name='asset-search'),
    path(r'api/bundle/<int:bundleId>/asset/<int:assetId>/setType', SetTypeView.as_view()),
    path(r'api/bundle/<int:bundleId>/asset/<int:assetId>/createProxy', TestCreateProxyView.as_view()),
    path(r'api/bundle/byproject/<int:projectId>', NewDeliverablesApiGet.as_view()),
    path(r'api/bundle/bybundleid/<int:bundleId>', NewDeliverabesApiBundleGet.as_view()),
    path(r'api/bundle/new', NewDeliverablesAPICreate.as_view(), name='bundle-create'),
    path(r'api/bundle/scan', NewDeliverableAPIScan.as_view()),
    path(r'api/bundle/adopt', AdoptExistingVidispineItemView.as_view(), name="adopt-asset"),
    path(r'api/bundle', NewDeliverablesAPIList.as_view(), name="new-api-list"),
    path(r'api/deliverables', NewDeliverableAssetAPIList.as_view(), name="new-asset-list"),
    path(r'api/deliverable', DeliverableAPIView.as_view()),
    path(r'api/typeslist', DeliverablesTypeListAPI.as_view(), name="asset-types"),
    path(r'api/bundle/<int:project_id>/count', CountDeliverablesView.as_view()),
    path(r'api/notify/', csrf_exempt(VSNotifyView.as_view()), name="vs-notifications"),
    path(r'api/bundle/<str:project_id>/asset/<int:asset_id>/atomresync', ResyncToPublished.as_view(), name="resync"),
    path(r'api/bundle/<str:project_id>/asset/<int:asset_id>/gnmwebsite', GNMWebsiteAPIView.as_view(), name="gnmwebsite"),
    path(r'api/bundle/<str:project_id>/asset/<int:asset_id>/mainstream', MainstreamAPIView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/youtube', YoutubeAPIView.as_view(), name='youtube'),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/dailymotion', DailyMotionAPIView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/<platform>/logs', PlatformLogsView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/<platform>/logupdate', PlatformLogUpdateView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/<platform>/send', TriggerOutputView.as_view()),
    path(r'api/bundle/started', DeliverableAPIStarted.as_view()),
    path(r'api/atom/<str:atom_id>', LaunchDetectorUpdateView.as_view(), name='atom_update'),
    path(r'api/bundle/commission/<int:commissionId>', BundlesForCommission.as_view()),
    path(r'api/asset/<int:asset_id>/jobretry/<str:job_id>', RetryJobForAsset.as_view()),
    re_path(r'^(?!api).*', NewDeliverableUI.as_view()),
]
