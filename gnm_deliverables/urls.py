"""
URLS for the Guardian Project plugin
"""

from django.conf.urls import patterns, url

from .views import DeliverableCreateView, DeliverableDetailView, DeliverableAssetUpdateAPIView, \
    DeliverablesSearchAPIView, DeliverableAssetCheckTypeChange, NaughtyListAPIView, NaughtyListUIView, DeliverableCreateFolderView, DeliverablesListView, \
    DeliverablesSearchForWorkingGroupAPIView, SearchForDeliverableAPIView, DeliverableAPIRetrieveView
from django.contrib.auth.decorators import login_required

urlpatterns = patterns(
    'portal.plugins.gnm_deliverables',
    url(r'^list/$', login_required(DeliverablesListView.as_view()), name='deliverables'),
    url(r'^(?P<project_id>.+-\d+)/create/?$', DeliverableCreateView, name='deliverables_create'),
    url(r'^(?P<pk>\d+)/?$', DeliverableDetailView, name='deliverables_detail'),
    url(r'^asset/(?P<pk>\d+)/?$', DeliverableAssetUpdateAPIView.as_view(), name='deliverable_asset_update'),
    url(r'^asset/(?P<pk>\d+)/check/?$', DeliverableAssetCheckTypeChange.as_view(), name='deliverable_asset_check_type'),
    url(r'^api/search/(?P<project_id>.+-\d+)/$', DeliverablesSearchAPIView.as_view(),
        name='deliverables_api_for_project'),
    url(r'api/(?P<pk>\d+)$', DeliverableAPIRetrieveView.as_view(), name='deliverable_api_retrieve'),
    url(r'^api/byFileName/$',SearchForDeliverableAPIView.as_view(), name='deliverable_search_by_filename' ),
    url(r'^api/search/$', DeliverablesSearchAPIView.as_view(), name='deliverables_api'),
    url(r'^api/missing/$', NaughtyListAPIView.as_view(), name='deliverables_naughtylist_api'),
    url(r'^create_folder/(?P<pk>\d+)/?$', DeliverableCreateFolderView.as_view(), name='deliverables_create_folder'),
    url(r'^api/by-working-group/(?P<working_group>.*)/$', DeliverablesSearchForWorkingGroupAPIView.as_view(), name='deliverables_search_workinggroup'),
    url(r'^missing/$', login_required(NaughtyListUIView.as_view()), name='deliverables_naughtylist')
)
