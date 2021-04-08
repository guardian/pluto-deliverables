from .AtomResponderProcessor import AtomResponderProcessor
from .AssetUpdatedProcessor import AssetUpdatedProcessor
from .vidispine_message_processor import VidispineMessageProcessor

##This structure is imported by name in the run_rabbitmq_responder
EXCHANGE_MAPPINGS = [
    {
        "exchange": 'pluto-atomresponder',
        "handler":  AtomResponderProcessor(),
        "exclusive": False
    },
    {
        "exchange": 'pluto-deliverables',
        "handler": AssetUpdatedProcessor(),
        "exclusive": False
    },
    {
        "exchange": 'vidispine-events',
        "handler": VidispineMessageProcessor(),
        "exclusive": True
    }
]
