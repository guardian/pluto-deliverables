from portal.plugins.gnm_masters import urls  # noqa
'''
Must import everything from all classes containing tests.
Probably because how plugins are loaded because standard nose-syntax to trigger specific ones does not work otherwise.
'''
from .models import *  # noqa
from .views import *  # noqa
