from .AtomResponderProcessor import AtomResponderProcessor
from .AssetUpdatedProcessor import AssetUpdatedProcessor
from .vidispine_message_processor import VidispineMessageProcessor
from .StoragetierArchivedMessageProcessor import StoragetierArchivedMessageProcessor
from .CDSResponderProcessor import CDSResponderProcessor, CDSInvalidProcessor
from .assetsweeper_message_processor import AssetSweeperMessageProcessor
from .vidispine_item_processor import VidispineItemProcessor

##This structure is imported by name in the run_rabbitmq_responder
EXCHANGE_MAPPINGS = [
    {
        "exchange": 'pluto-atomresponder',
        "handler":  AtomResponderProcessor(),
    },
    {
        "exchange": 'pluto-deliverables',
        "handler": AssetUpdatedProcessor(),
    },
    {
        "exchange": 'vidispine-events',
        "handler": VidispineMessageProcessor(),
    },
    {
        "exchange": "storagetier-online-archive",
        "handler": StoragetierArchivedMessageProcessor(),
    },
    {
        "exchange": "cdsresponder",
        "handler": CDSResponderProcessor(),
    },
    {
        "exchange": "cdsresponder",
        "handler": CDSInvalidProcessor(),
    },
    {
        "exchange": 'assetsweeper',
        "handler": AssetSweeperMessageProcessor(),
    },
    {
        "exchange": 'vidispine-events',
        "handler": VidispineItemProcessor(),
    },
]
