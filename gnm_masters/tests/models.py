# coding: utf-8
from django.conf import settings
from portal.plugins.gnm_vidispine_utils import constants as const
from portal.plugins.gnm_misc_utils.test_base import SemiAutomaticCleanupTestBase
from portal.plugins.gnm_masters.models import VSMaster
from portal.plugins.gnm_projects.models import VSProject
from portal.plugins.gnm_commissions.models import VSCommission
from nose.plugins.attrib import attr
import datetime


class MasterTest(SemiAutomaticCleanupTestBase):

    def setUp(self):
        super(MasterTest, self).setUp()
        self.datetime_now = datetime.datetime.now().strftime(const.VS_DATETIMEFORMAT)  # Saving a timestamp so it's easy to use in creation and later in validation

    def tearDown(self):
        super(MasterTest, self).tearDown()

    def _create_master(self, headline=None):
        if headline is None:
            headline = 'SOME HEADLINE'
        data = {
            const.GNM_ASSET_TITLE: 'A TITLE',
            const.GNM_ASSET_DESCRIPTION: 'DESCRIPTION',
            const.GNM_ASSET_KEYWORDS: [],
            const.GNM_ASSET_FILENAME: 'FILENAME',
            const.GNM_ASSET_FILMING_LOCATION: 'OUTSIDE',
            const.GNM_ASSET_CREATEDBY: str(self.user.pk),
            const.GNM_ASSET_FILE_CREATED: self.datetime_now,
            const.GNM_ASSET_FILE_LAST_MODIFIED: self.datetime_now,
            const.GNM_MASTERS_DAILYMOTION_NOMOBILEACCESS: ['no_mobile_access'],
            const.GNM_MASTERS_DAILYMOTION_DESCRIPTION: 'DESCRIPTION',
            const.GNM_MASTERS_DAILYMOTION_PUBLISH: datetime.date.today(),
            const.GNM_MASTERS_DAILYMOTION_CONTAINSADULTCONTENT: ['contains_adult_content'],
            const.GNM_MASTERS_DAILYMOTION_KEYWORDS: [],
            const.GNM_MASTERS_DAILYMOTION_AUTHOR: 'SOME AUTHOR',
            const.GNM_MASTERS_DAILYMOTION_CATEGORY: 'SOME CATEGORY',
            const.GNM_MASTERS_DAILYMOTION_TITLE: 'SOME DAILYMOTIONS TITLE',
            const.GNM_MASTERS_GENERIC_REMOVE: datetime.date.today(),
            const.GNM_MASTERS_GENERIC_PREVENTMOBILEUPLOAD: ['prevent_mobile_upload'],
            const.GNM_MASTERS_GENERIC_CONTAINSADULTCONTENT: ['contains_adult_content'],
            const.GNM_MASTERS_GENERIC_OWNER: 'SOME OWNER',
            const.GNM_MASTERS_GENERIC_PUBLISH: datetime.date.today(),
            const.GNM_MASTERS_GENERIC_TITLEID: 'SOME TITLEID',
            const.GNM_MASTERS_GENERIC_INTENDEDUPLOADPLATFORMS: [],
            const.GNM_MASTERS_GENERIC_UKONLY: ['ukonly'],
            const.GNM_MASTERS_GENERIC_HOLDINGIMAGE_16X9: '',
            const.GNM_MASTERS_GENERIC_HOLDINGIMAGE_5X4: '',
            const.GNM_MASTERS_GENERIC_UPLOADTYPE: [],
            const.GNM_MASTERS_GENERIC_WHOLLYOWNED: ['wholly_owned'],
            const.GNM_MASTERS_GENERIC_STATUS: 'Published',
            const.GNM_MASTERS_INTERACTIVE_TITLE: 'INTERACTIVE TITLE',
            const.GNM_MASTERS_INTERACTIVE_PROJECTREF: '',
            const.GNM_MASTERS_WEBSITE_STANDFIRST: 'SOME STANDFIRST',
            const.GNM_MASTERS_WEBSITE_BYLINE: 'AWESOME BYLINE',
            const.GNM_MASTERS_WEBSITE_TAGS: [],
            const.GNM_MASTERS_WEBSITE_HEADLINE: headline,
            const.GNM_MASTERS_WEBSITE_LINKTEXT: 'CLICK ME',
            const.GNM_MASTERS_WEBSITE_TRAIL: 'TRAIL OF THINGIES',
            const.GNM_MASTERS_MAINSTREAMSYNDICATION_TITLE: 'SYNDICATION TITLE',
            const.GNM_MASTERS_MAINSTREAMSYNDICATION_CATEGORY: 'SYNDICATION CATEGORY',
            const.GNM_MASTERS_MAINSTREAMSYNDICATION_KEYWORDS: [],
            const.GNM_MASTERS_MAINSTREAMSYNDICATION_DESCRIPTION: 'SYNDICATION DESCRIPTION',
            const.GNM_MASTERS_MAINSTREAMSYNDICATION_PUBLISH: datetime.date.today(),
            const.GNM_MASTERS_MAINSTREAMSYNDICATION_CONTAINSADULTCONTENT: [],
            const.GNM_MASTERS_MAINSTREAMSYNDICATION_AUTHOR: 'SYNDICATION AUTHOR',
            const.GNM_MASTERS_YOUTUBE_KEYWORDS: [],
            const.GNM_MASTERS_YOUTUBE_ALLOWRESPONSES: ['allow_responses'],
            const.GNM_MASTERS_YOUTUBE_PUBLISH: datetime.date.today(),
            const.GNM_MASTERS_YOUTUBE_UGCPOLICY: 'SOME UGCPOLICY',
            const.GNM_MASTERS_YOUTUBE_CONTAINSADULTCONTENT: ['contains_adult_content'],
            const.GNM_MASTERS_YOUTUBE_UPLOADSTATUS: 'Upload Failed',
            const.GNM_MASTERS_YOUTUBE_ALLOWEMBEDDING: ['allow_embedding'],
            const.GNM_MASTERS_YOUTUBE_ALLOWRATINGS: ['allow_ratings'],
            const.GNM_MASTERS_YOUTUBE_DESCRIPTION: 'YOUTUBE DESCRIPTION',
            const.GNM_MASTERS_YOUTUBE_TITLE: 'YOUTUBE TITLE',
            const.GNM_MASTERS_YOUTUBE_UPLOADLOG: ['IT WAS UPLOADED', 'AND UPLOADED SOME MORE'],
            const.GNM_MASTERS_YOUTUBE_COMMERCIALPOLICY: 'THERE WAS A POLICY',
            const.GNM_MASTERS_YOUTUBE_MATCHINGPOLICY: ['matching_policy'],
            const.GNM_MASTERS_YOUTUBE_ALLOWCOMMENTS: ['allow_comments'],
            const.GNM_MASTERS_YOUTUBE_CATEGORY: 'A CATEGORY',
        }
        return VSMaster.vs_create(data=data, user=self.user)

    def _validate_master(self, master, headline=None):
        if headline is None:
            headline = 'SOME HEADLINE'

        self.assertIsNotNone(master)
        self.assertEqual(master.get(const.GNM_ASSET_TITLE), 'A TITLE')
        self.assertEqual(master.get(const.GNM_ASSET_DESCRIPTION), 'DESCRIPTION')
        self.assertEqual(master.get(const.GNM_ASSET_KEYWORDS), None)
        self.assertEqual(master.get(const.GNM_ASSET_FILENAME), 'FILENAME')
        self.assertEqual(master.get(const.GNM_ASSET_FILMING_LOCATION), 'OUTSIDE')
        self.assertEqual(master.get(const.GNM_ASSET_CREATEDBY), str(self.user.pk))
        self.assertEqual(master.get(const.GNM_ASSET_FILE_CREATED), self.datetime_now)
        self.assertEqual(master.get(const.GNM_ASSET_FILE_LAST_MODIFIED), self.datetime_now)
        self.assertEqual(master.get(const.GNM_MASTERS_DAILYMOTION_NOMOBILEACCESS), 'no_mobile_access')
        self.assertEqual(master.get(const.GNM_MASTERS_DAILYMOTION_DESCRIPTION), 'DESCRIPTION')
        self.assertEqual(master.get(const.GNM_MASTERS_DAILYMOTION_PUBLISH), datetime.date.today().strftime(const.VS_DATEFORMAT))
        self.assertEqual(master.get(const.GNM_MASTERS_DAILYMOTION_CONTAINSADULTCONTENT), 'contains_adult_content')
        self.assertEqual(master.get(const.GNM_MASTERS_DAILYMOTION_KEYWORDS), None)
        self.assertEqual(master.get(const.GNM_MASTERS_DAILYMOTION_AUTHOR), 'SOME AUTHOR')
        self.assertEqual(master.get(const.GNM_MASTERS_DAILYMOTION_CATEGORY), 'SOME CATEGORY')
        self.assertEqual(master.get(const.GNM_MASTERS_DAILYMOTION_TITLE), 'SOME DAILYMOTIONS TITLE')
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_REMOVE), datetime.date.today().strftime(const.VS_DATEFORMAT))
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_PREVENTMOBILEUPLOAD), 'prevent_mobile_upload')
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_CONTAINSADULTCONTENT), 'contains_adult_content')
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_OWNER), 'SOME OWNER')
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_PUBLISH), datetime.date.today().strftime(const.VS_DATEFORMAT))
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_TITLEID), 'SOME TITLEID')
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_INTENDEDUPLOADPLATFORMS), None)
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_UKONLY), 'ukonly')
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_HOLDINGIMAGE_16X9), None)
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_HOLDINGIMAGE_5X4), None)
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_UPLOADTYPE), None)
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_WHOLLYOWNED), 'wholly_owned')
        self.assertEqual(master.get(const.GNM_MASTERS_GENERIC_STATUS), 'Published')
        self.assertEqual(master.get(const.GNM_MASTERS_INTERACTIVE_TITLE), 'INTERACTIVE TITLE')
        self.assertEqual(master.get(const.GNM_MASTERS_INTERACTIVE_PROJECTREF), None)
        self.assertEqual(master.get(const.GNM_MASTERS_WEBSITE_STANDFIRST), 'SOME STANDFIRST')
        self.assertEqual(master.get(const.GNM_MASTERS_WEBSITE_BYLINE), 'AWESOME BYLINE')
        self.assertEqual(master.get(const.GNM_MASTERS_WEBSITE_TAGS), None)
        self.assertEqual(master.get(const.GNM_MASTERS_WEBSITE_HEADLINE), headline)
        self.assertEqual(master.get(const.GNM_MASTERS_WEBSITE_LINKTEXT), 'CLICK ME')
        self.assertEqual(master.get(const.GNM_MASTERS_WEBSITE_TRAIL), 'TRAIL OF THINGIES')
        self.assertEqual(master.get(const.GNM_MASTERS_MAINSTREAMSYNDICATION_TITLE), 'SYNDICATION TITLE')
        self.assertEqual(master.get(const.GNM_MASTERS_MAINSTREAMSYNDICATION_CATEGORY), 'SYNDICATION CATEGORY')
        self.assertEqual(master.get(const.GNM_MASTERS_MAINSTREAMSYNDICATION_KEYWORDS), None)
        self.assertEqual(master.get(const.GNM_MASTERS_MAINSTREAMSYNDICATION_DESCRIPTION), 'SYNDICATION DESCRIPTION')
        self.assertEqual(master.get(const.GNM_MASTERS_MAINSTREAMSYNDICATION_PUBLISH), datetime.date.today().strftime(const.VS_DATEFORMAT))
        self.assertEqual(master.get(const.GNM_MASTERS_MAINSTREAMSYNDICATION_CONTAINSADULTCONTENT), None)
        self.assertEqual(master.get(const.GNM_MASTERS_MAINSTREAMSYNDICATION_AUTHOR), 'SYNDICATION AUTHOR')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_KEYWORDS), None)
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_ALLOWRESPONSES), 'allow_responses')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_PUBLISH), datetime.date.today().strftime(const.VS_DATEFORMAT))
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_UGCPOLICY), 'SOME UGCPOLICY')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_CONTAINSADULTCONTENT), 'contains_adult_content')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_UPLOADSTATUS), 'Upload Failed')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_ALLOWEMBEDDING), 'allow_embedding')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_ALLOWRATINGS), 'allow_ratings')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_DESCRIPTION), 'YOUTUBE DESCRIPTION')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_TITLE), 'YOUTUBE TITLE')
        uploadlogs = master.get(const.GNM_MASTERS_YOUTUBE_UPLOADLOG)
        self.assertIn(uploadlogs[0], ['IT WAS UPLOADED', 'AND UPLOADED SOME MORE'])
        self.assertIn(uploadlogs[1], ['IT WAS UPLOADED', 'AND UPLOADED SOME MORE'])
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_COMMERCIALPOLICY), 'THERE WAS A POLICY')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_MATCHINGPOLICY), 'matching_policy')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_ALLOWCOMMENTS), 'allow_comments')
        self.assertEqual(master.get(const.GNM_MASTERS_YOUTUBE_CATEGORY), 'A CATEGORY')

    def test_add_master(self):
        master = self._create_master()
        self._validate_master(master)

    def test_add_minimum_master(self):
        data = {
        }
        master = VSMaster.vs_create(data=data, user=self.user)
        self.assertIsNotNone(master)

    def test_title_id_script_execution(self):
        ''' test_title_id_script_execution
        Assert titleid script runs properly
        '''
        project = VSProject.vs_create(data={const.GNM_PROJECT_HEADLINE: 'Some project headline'}, user=self.user)
        commission = VSCommission.vs_create(data={const.GNM_COMMISSION_TITLE: 'Some commission title', }, user=self.user)
        commission.add_project(project)
        master = self._create_master()
        master.generate_and_set_new_title_id(project)
        title_id = master.get(const.GNM_MASTERS_GENERIC_TITLEID)
        self.assertTrue(len(title_id) > 0)  # Assert the string isn't empty

    def test_title_id_script_fail_gracefully(self):
        ''' test_title_id_script_fail_gracefully
        Assert it does not crash if the script execution fails in some way, e.g. invalid path.
        '''
        project = VSProject.vs_create(data={const.GNM_PROJECT_HEADLINE: 'Some project headline'}, user=self.user)
        commission = VSCommission.vs_create(data={const.GNM_COMMISSION_TITLE: 'Some commission title', }, user=self.user)
        commission.add_project(project)
        master = self._create_master()
        settings.TITLE_ID_SCRIPT = '/this_path_is_highly_unlikely_to_exist/fake_name.pl'
        master.generate_and_set_new_title_id(project)
        title_id = master.get(const.GNM_MASTERS_GENERIC_TITLEID)
        self.assertEqual(title_id, '')  # Empty string is expected even if script fails

    def test_title_id_script_none_zero_exit_code(self):
        '''test_title_id_script_none_zero_exit_code
        Assert nothing title id is empty if the script exits with none-zero exit code.
        '''
        project = VSProject.vs_create(data={const.GNM_PROJECT_HEADLINE: 'Some project headline'}, user=self.user)
        commission = VSCommission.vs_create(data={const.GNM_COMMISSION_TITLE: 'Some commission title', }, user=self.user)
        commission.add_project(project)
        master = self._create_master()
        settings.TITLE_ID_SCRIPT = settings.TITLE_ID_SCRIPT + ' --fail'
        master.generate_and_set_new_title_id(project)
        title_id = master.get(const.GNM_MASTERS_GENERIC_TITLEID)
        self.assertEqual(title_id, '')  # Empty string is expected even if script fails

    def test_retrieve_master(self):
        id = self._create_master().id
        master = VSMaster(id=id, user=self.user)
        self._validate_master(master)

    def test_get_parent_project(self):
        master = self._create_master()
        project = VSProject.vs_create(data={const.GNM_PROJECT_HEADLINE: 'Some project headline'}, user=self.user)
        project.add_master(master)
        master2 = VSMaster(id=master.id, user=self.user)
        self.assertEqual(master.get_parent_project().id, project.id)
        self.assertEqual(master2.get_parent_project().id, project.id)

    @attr('slow')
    def test_vs_search_master(self):
        import uuid
        headline = 'SUPERUNIQUEHEADLINE:{uuid}'.format(uuid=str(uuid.uuid4()))
        self._create_master(headline=headline)
        self._create_master(headline=headline)
        self._create_master(headline=headline)
        criteria = '<AND><{type}>{headline}</{type}></AND>'.format(
            type=const.GNM_MASTERS_WEBSITE_HEADLINE,
            headline=headline
        )

        # Reindex so search works.
        self.blocking_reindex('item')

        two = VSMaster.vs_search(criteria=criteria, user=self.user, first=1, number=2)
        all = VSMaster.vs_search(criteria=criteria, user=self.user, fetch_all=True)

        self.assertEqual(len(two), 2)
        self.assertEqual(two.hits, 3)
        self.assertEqual(len(all), 3)
