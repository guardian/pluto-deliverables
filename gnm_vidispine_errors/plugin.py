from portal.pluginbase.core import Plugin, implements  # flake8: noqa - there's no syntax error here
from portal.generic.plugin_interfaces import IPluginURL, IAppRegister

import logging
logger = logging.getLogger(__name__)


class GnmVidispineErrorRegister(Plugin):
    implements(IAppRegister)

    plugin_guid = '3eb8283e-e0be-11e3-a2f8-089e01b9aebf'

    def __init__(self):
        self.name = 'Guardian MIT VidispineError'
        logger.info('{name} initialized'.format(name=self.name))

    def __call__(self):
        return {
            'name': self.name,
            'version': '1.0.0',
            'author': 'Codemill AB',
            'author_url': 'www.codemill.se',
            'notes': 'Copyright (C) 2014. All rights reserved.',
        }

gnmvidispineerrorregisterplugin = GnmVidispineErrorRegister()


class GnmVidispineErrorURL(Plugin):
    implements(IPluginURL)

    name = "Guardian MIT VidispineError URL"
    urls = 'portal.plugins.gnm_vidispine_errors.urls'
    urlpattern = r'^vidispine_error/'
    namespace = 'gnm_vidispine_error'
    plugin_guid = "4b0362e8-e0be-11e3-bb7b-089e01b9aebf"

    def __init__(self):
        logger.info('{name} initialized'.format(name=self.name))

# Load the URL plugin
gnmvidispineerrorurlplugin = GnmVidispineErrorURL()
