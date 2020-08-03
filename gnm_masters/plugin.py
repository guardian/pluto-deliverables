from portal.pluginbase.core import Plugin, implements  # flake8: noqa - there's no syntax error here
from portal.generic.plugin_interfaces import IPluginURL, IAppRegister, IPluginBlock

import logging
logger = logging.getLogger(__name__)


class GnmMasterRegister(Plugin):
    implements(IAppRegister)

    plugin_guid = '9f920268-d4f9-11e3-bc89-089e01b9aebf'

    def __init__(self):
        self.name = 'Guardian MIT Master'
        logger.info('{name} initialized'.format(name=self.name))

    def __call__(self):
        return {
            'name': self.name,
            'version': '1.0.0',
            'author': 'Codemill AB',
            'author_url': 'www.codemill.se',
            'notes': 'Copyright (C) 2014. All rights reserved.',
        }

gnmmasterregisterplugin = GnmMasterRegister()


class GnmMasterURL(Plugin):
    implements(IPluginURL)

    name = "Guardian MIT Master URL"
    urls = 'portal.plugins.gnm_masters.urls'
    urlpattern = r'^master/'
    namespace = 'gnm_master'
    plugin_guid = 'b4c4c698-d4f9-11e3-a381-089e01b9aebf'

    def __init__(self):
        logger.info('{name} initialized'.format(name=self.name))

# Load the URL plugin
gnmmasterurlplugin = GnmMasterURL()


class GnmMasterItemControls(Plugin):
    implements(IPluginBlock)

    def __init__(self):
        self.name = "MediaViewHeader"
        self.plugin_guid = 'e9548840-b950-4f86-8021-106fc232bbfe'

    def return_string(self, tagname, context, request_context, *future_args):
        (meta, system_meta, specific_meta)= request_context['item'].getMetadata()

        gnm_type_values = map(lambda info: info['value'], meta.getFieldByName("gnm_type").getValue())
        if len(gnm_type_values)<1 or gnm_type_values[0] != 'Master':
            return None
        else:
            return {'guid': self.plugin_guid,
                    'template': 'gnm_masters/media_view_header_insert.html',
                    'context': {

                    }}


gnm_master_item_controls = GnmMasterItemControls()
