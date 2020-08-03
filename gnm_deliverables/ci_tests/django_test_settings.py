import os
BASE_DIR = "/tmp"
SECRET_KEY = '9nc9BMfbTyrlOP8v53afZfrNgOtCsrYKZ+BdMhsqmNomuuzJo'
INSTALLED_APPS = ['portal.plugins.gnm_deliverables',
                  'portal.plugins.gnm_projects',
                  'django.contrib.auth',
                  'django.contrib.contenttypes',
                  'django.contrib.sessions',
                  'portal.plugins.gnm_commissions',
                  'south']

ROOT_URLCONF = 'portal.plugins.gnm_deliverables.urls'
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

PROJECTLOCKER_HOST = "localhost"
PROJECTLOCKER_PORT = "443"
PROJECTLOCKER_SHARED_SECRET = "sharedsecret"

PROJECT_CREATE_PROJECTLOCKER = True