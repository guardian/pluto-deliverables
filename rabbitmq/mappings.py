from .AtomResponderProcessor import AtomResponderProcessor

##This structure is imported by name in the run_rabbitmq_responder
EXCHANGE_MAPPINGS = [
    {
        "exchange": 'pluto-atomresponder',
        "handler":  AtomResponderProcessor(),
    }
]
