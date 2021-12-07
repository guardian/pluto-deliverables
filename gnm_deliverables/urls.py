"""
URLS for the Guardian Project plugin
"""

from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from gnm_deliverables.views.metadata_views import GNMWebsiteAPIView, YoutubeAPIView, DailyMotionAPIView, OovvuuAPIView, \
    MainstreamAPIView, PlatformLogsView, TriggerOutputView, PlatformLogUpdateView, ResyncToPublished, ReutersConnectAPIView
from gnm_deliverables.views.views import DeliverablesTypeListAPI, AdoptExistingVidispineItemView, \
    SetTypeView, TestCreateProxyView, NewDeliverablesAPIList, NewDeliverableAssetAPIList, DeliverableAPIView, \
    NewDeliverablesAPICreate, NewDeliverableAPIScan, NewDeliverableUI, CountDeliverablesView, NewDeliverablesApiGet, \
    DeliverableAPIStarted, LaunchDetectorUpdateView, SearchForDeliverableAPIView, GenericAssetSearchAPI, NewDeliverabesApiBundleGet, \
    BundlesForCommission, RetryJobForAsset, InvalidAPIList, CountInvalid, CountInvalidByType, CountInvalidByStatus, GetAssetView, \
    TestAndFixDropfolder
from gnm_deliverables.views.deliverables_dash_views import *

urlpatterns = [
    path(r'api/asset/byFileName', SearchForDeliverableAPIView.as_view()),
    path(r'api/asset/search', GenericAssetSearchAPI.as_view(), name='asset-search'),
    path(r'api/bundle/<int:bundleId>/asset/<int:assetId>/setType', SetTypeView.as_view()),
    path(r'api/bundle/<int:bundleId>/asset/<int:assetId>/createProxy', TestCreateProxyView.as_view()),
    path(r'api/bundle/byproject/<int:projectId>', NewDeliverablesApiGet.as_view()),
    path(r'api/bundle/bybundleid/<int:bundleId>', NewDeliverabesApiBundleGet.as_view()),
    path(r'api/bundle/new', NewDeliverablesAPICreate.as_view(), name='bundle-create'),
    path(r'api/asset/<int:pk>', GetAssetView.as_view()),
    path(r'api/asset/<int:asset>/notes', ListSyndicationNotes.as_view()),
    path(r'api/asset/<int:asset>/notes/new', AddSyndicationNote.as_view()),
    path(r'api/bundle/new', NewDeliverablesAPICreate.as_view()),
    path(r'api/bundle/scan', NewDeliverableAPIScan.as_view()),
    path(r'api/bundle/adopt', AdoptExistingVidispineItemView.as_view(), name="adopt-asset"),
    path(r'api/bundle', NewDeliverablesAPIList.as_view(), name="new-api-list"),
    path(r'api/deliverables', NewDeliverableAssetAPIList.as_view(), name="new-asset-list"),
    path(r'api/deliverable', DeliverableAPIView.as_view()),
    path(r'api/typeslist', DeliverablesTypeListAPI.as_view(), name="asset-types"),
    path(r'api/bundle/<int:project_id>/count', CountDeliverablesView.as_view()),
    path(r'api/bundle/<int:project_id>/dropfolder', TestAndFixDropfolder.as_view(), name="dropfolder"),
    path(r'api/bundle/<str:project_id>/asset/<int:asset_id>/atomresync', ResyncToPublished.as_view(), name="resync"),
    path(r'api/bundle/<str:project_id>/asset/<int:asset_id>/gnmwebsite', GNMWebsiteAPIView.as_view(), name="gnmwebsite"),
    path(r'api/bundle/<str:project_id>/asset/<int:asset_id>/mainstream', MainstreamAPIView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/youtube', YoutubeAPIView.as_view(), name='youtube'),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/dailymotion', DailyMotionAPIView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/oovvuu', OovvuuAPIView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/reutersconnect', ReutersConnectAPIView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/<platform>/logs', PlatformLogsView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/<platform>/logupdate', PlatformLogUpdateView.as_view()),
    path(r'api/bundle/<int:project_id>/asset/<int:asset_id>/<platform>/send', TriggerOutputView.as_view()),
    path(r'api/bundle/started', DeliverableAPIStarted.as_view()),
    path(r'api/atom/<str:atom_id>', LaunchDetectorUpdateView.as_view(), name='atom_update'),
    path(r'api/bundle/commission/<int:commissionId>', BundlesForCommission.as_view()),
    path(r'api/asset/<int:asset_id>/jobretry/<str:job_id>', RetryJobForAsset.as_view()),
    path(r'api/invalid', InvalidAPIList.as_view(), name="invalid-list"),
    path(r'api/invalid/count', CountInvalid.as_view()),
    path(r'api/invalid/countbytype', CountInvalidByType.as_view()),
    path(r'api/invalid/countbystatus', CountInvalidByStatus.as_view()),
    path(r'api/dash/assets', DeliverableAssetsList.as_view(), name="dashboard-assets"),
    path(r'api/dash/summary', PublicationDatesSummary.as_view()),
    path(r'api/capiscan', GNMWebsiteSearch.as_view()),
    re_path(r'^(?!api).*', NewDeliverableUI.as_view()),
]
