# Import all plugins here
from os import environ
if not 'CI' in environ:
    from plugin import *  # noqa
