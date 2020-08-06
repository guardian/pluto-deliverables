import os
BASE_DIR = "/tmp"
SECRET_KEY = 'SjQuO37hU1CzDLHKXd1O5y9n9ioiKjkQzu5tj/L'
INSTALLED_APPS = ['portal.plugins.gnm_masters',
                  'django.contrib.auth',
                  'django.contrib.contenttypes',
                  'django.contrib.sessions',
                  'portal.plugins.gnm_commissions',
                  'portal.plugins.gnm_projects',
                  'south']

ROOT_URLCONF = 'portal.plugins.gnm_masters.urls'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'djangotestdb.sqlite3'),
    }
}

PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

MIDDLEWARE_CLASSES = [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.locale.LocaleMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

VIDISPINE_URL="http://localhost"
VIDISPINE_PORT=8080
VIDISPINE_USERNAME="fakeuser"
VIDISPINE_PASSWORD="fakepassword"

MASTER_INGEST_EDL_XML_TEMP_PATH = "/tmp"

TRIGGER_PROJECTION = 'inmeta_V5'
TRIGGER_FOLDER_LOCATIONS = {
    'guardian': {
        'New': {
            'path': '/tmp/guardian',
            'field': 'gnm_master_gnmwebsite_upload_status'
        },
        'Update': {
            'path': '/tmp/guardianupdate',
            'field': 'gnm_master_gnmwebsite_upload_status'
        }
    },
    'dailymotion':{
        'New': {
            'path': '/tmp/dailymotion',
            'field': 'gnm_master_dailymotion_uploadstatus'
        },
        'Update': {
            'path': '/tmp/dailymotionupdate',
            'field': 'gnm_master_dailymotion_uploadstatus'
        }
    },
    'facebook': {
        'path':'/tmp/facebook',
        'field': 'gnm_master_facebook_uploadstatus'
    },
    'interactive': {
        'path': '/tmp/interactive',
        'field': 'gnm_master_interactive_uploadstatus'
    },
    'mediaatom': {
        'path': '/tmp/mediaatom',
        'field': 'gnm_master_mediaatom_uploadstatus'
    },
    'mediawall': {
        'path': '/tmp/mediawall',
        'field': 'gnm_master_mediawall_uploadstatus'
    },
    'spotify': {
        'path': '/tmp/spotify',
        'field': 'gnm_master_spotify_uploadstatus'
    },
    'syndication': {
        'path': '/tmp/syndication',
        'field': 'gnm_master_mainstreamsyndication_uploadstatus'
    },
    'youtube': {
        'New': {
            'path': '/tmp/youtube',
            'field': 'gnm_master_youtube_uploadstatus'
        },
        'Update': {
            'path': '/tmp/youtubeupdate',
            'field': 'gnm_master_youtube_uploadstatus'
        },
    }
}

