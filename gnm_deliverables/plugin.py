import logging

from portal.generic.plugin_interfaces import IPluginURL, IAppRegister
from portal.pluginbase.core import Plugin, implements  # flake8: noqa - there's no syntax error here

logger = logging.getLogger(__name__)


class GnmDeliverablesRegister(Plugin):
    implements(IAppRegister)

    plugin_guid = '9cd34058-04d0-4058-8654-d866b6e14736'

    def __init__(self):
        self.name = 'Guardian MIT Deliverables'
        logger.info('{name} initialized'.format(name=self.name))

    def __call__(self):
        return {
            'name': self.name,
            'version': '1.0.0',
            'author': 'Codemill AB',
            'author_url': 'www.codemill.se',
            'notes': 'Copyright (C) 2018. All rights reserved.',
        }

gnmprojectregisterplugin = GnmDeliverablesRegister()


class GnmDeliverablesURL(Plugin):
    implements(IPluginURL)

    name = "Guardian MIT Project URL"
    urls = 'portal.plugins.gnm_deliverables.urls'
    urlpattern = r'^deliverables/'
    namespace = 'gnm_deliverables'
    plugin_guid = '4d5afec8-a794-4f0a-8e9b-29f13f1e3dc3'

    def __init__(self):
        logger.info('{name} initialized'.format(name=self.name))

gnmprojecturlplugin = GnmDeliverablesURL()
