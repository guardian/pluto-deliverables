from .AtomResponderProcessor import AtomResponderProcessor
from .AssetUpdatedProcessor import AssetUpdatedProcessor

##This structure is imported by name in the run_rabbitmq_responder
EXCHANGE_MAPPINGS = [
    {
        "exchange": 'pluto-atomresponder',
        "handler":  AtomResponderProcessor(),
    },
    {
        "exchange": 'pluto-deliverables',
        "handler": AssetUpdatedProcessor()
    }
]
