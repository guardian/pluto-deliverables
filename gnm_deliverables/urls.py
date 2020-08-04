"""
URLS for the Guardian Project plugin
"""

from django.urls import path

from .views import DeliverableCreateView, DeliverableDetailView, DeliverableAssetUpdateAPIView, \
    DeliverablesSearchAPIView, DeliverableAssetCheckTypeChange, NaughtyListAPIView, NaughtyListUIView, DeliverableCreateFolderView, DeliverablesListView, \
    DeliverablesSearchForWorkingGroupAPIView, SearchForDeliverableAPIView, DeliverableAPIRetrieveView
from .views import NewDeliverablesAPIList, NewDeliverableAssetAPIList, NewDeliverablesAPICreate, NewDeliverableAPIScan, NewDeliverableUI
from django.contrib.auth.decorators import login_required
from django.contrib import admin

urlpatterns = [
    path('admin/', admin.site.urls),
    # path(r'list/', login_required(DeliverablesListView.as_view()), name='deliverables'),
    path(r'api/bundle/new', NewDeliverablesAPICreate.as_view()),
    path(r'api/bundle/scan', NewDeliverableAPIScan.as_view()),
    path(r'api/bundle', NewDeliverablesAPIList.as_view(), name="new-api-list"),
    path(r'api/deliverables', NewDeliverableAssetAPIList.as_view(), name="new-asset-list"),
    path(r'', NewDeliverableUI.as_view())
    # path(r'(?P<project_id>.+-\d+)/create/?', DeliverableCreateView, name='deliverables_create'),
    # path(r'(?P<pk>\d+)/?', DeliverableDetailView, name='deliverables_detail'),
    # path(r'asset/(?P<pk>\d+)/?', DeliverableAssetUpdateAPIView.as_view(), name='deliverable_asset_update'),
    # path(r'asset/(?P<pk>\d+)/check/?', DeliverableAssetCheckTypeChange.as_view(), name='deliverable_asset_check_type'),
    # path(r'api/search/(?P<project_id>.+-\d+)/', DeliverablesSearchAPIView.as_view(),
    #     name='deliverables_api_for_project'),
    # path(r'api/(?P<pk>\d+)', DeliverableAPIRetrieveView.as_view(), name='deliverable_api_retrieve'),
    # path(r'api/byFileName/',SearchForDeliverableAPIView.as_view(), name='deliverable_search_by_filename' ),
    # path(r'api/search/', DeliverablesSearchAPIView.as_view(), name='deliverables_api'),
    # path(r'api/missing/', NaughtyListAPIView.as_view(), name='deliverables_naughtylist_api'),
    # path(r'create_folder/(?P<pk>\d+)/?', DeliverableCreateFolderView.as_view(), name='deliverables_create_folder'),
    # path(r'api/by-working-group/(?P<working_group>.*)/', DeliverablesSearchForWorkingGroupAPIView.as_view(), name='deliverables_search_workinggroup'),
    # path(r'missing/', login_required(NaughtyListUIView.as_view()), name='deliverables_naughtylist')
]