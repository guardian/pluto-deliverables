"""
URLS for the Guardian Master plugin
"""

from django.conf.urls.defaults import patterns, url, include
from .views import MasterNewView, MasterView, MasterListView, MasterSearchAPIView, MasterSearchView, MasterListAPIView, MasterListMineAPIView, MasterIngestView, MasterSetJobIdView, MasterJobRetryView, MasterUpdateStatusView, MasterUploadLogView, MasterImportViaFilename, \
    MasterIdFileView, UploadEDLDataView, MasterListForParentCollectionAPIView, MasterImportViaS3, MasterTrigger, SearchForMasterAPIView
urlpatterns = patterns(
    'portal.plugins.gnm_masters',
    url(r'^list/$', MasterListView, name='masters'),
    url(r'^search/$', MasterSearchView, name='masters_search'),
    url(r'^new/(?P<project_id>.+-\d+)/$', MasterNewView, name='master_new'),
    url(r'^api/search/$', MasterSearchAPIView.as_view(), name='masters_search_api'),
    url(r'^api/byFileName/$', SearchForMasterAPIView.as_view(), name='masters_search_filename'),
    url(r'^api/group/(?P<uuid>[\w -]+)/$', MasterListAPIView.as_view(), name='masters_api'),
    url(r'^api/my/$', MasterListMineAPIView.as_view(), name='my_masters_api'),
    url(r'^api/commission/(?P<collection_id>.+-\d+)/$', MasterListForParentCollectionAPIView.as_view(), name='masters_api_for_collection'),
    url(r'^(?P<master_id>.+-\d+)/ingest/$', MasterIngestView, name='master_ingest'),
    url(r'^(?P<master_id>.+-\d+)/ingest/id_file/$', MasterIdFileView, name='master_id_file'),
    url(r'^(?P<master_id>.+-\d+)/ingest/set_job_id/$', MasterSetJobIdView, name='master_set_job_id'),
    url(r'^(?P<master_id>.+-\d+)/ingest/upload_edl/$', UploadEDLDataView.as_view(), name='master_ingest_upload_edl'),
    url(r'^(?P<master_id>.+-\d+)/import_with_filename/$', MasterImportViaFilename, name='master_import_via_filename'),
    url(r'^(?P<master_id>.+-\d+)/import_via_s3/$', MasterImportViaS3, name='master_import_via_s3'),
    url(r'^(?P<master_id>.+-\d+)/ingest/retry/$', MasterJobRetryView, name='master_retry_ingest'),
    url(r'^(?P<master_id>.+-\d+)/$', MasterView, name='master'),
    url(r'^(?P<master_id>.+-\d+)/set_status/(?P<fieldname>\w+)/$', MasterUpdateStatusView, name='master_set_status'),
    url(r'^(?P<master_id>.+-\d+)/upload_logs/$', MasterUploadLogView.as_view(), name='master_get_upload_logs'),
        url(r'^s3direct/', include('s3direct.urls')),
    url(r'^(?P<master_id>.+-\d+)/trigger/(?P<target>\w+)$', MasterTrigger.as_view(), name='master_trigger'),
)
