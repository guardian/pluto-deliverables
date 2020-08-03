import django.dispatch

pre_vs_call = django.dispatch.Signal(providing_args=["method", "url", "uuid"])
post_vs_call = django.dispatch.Signal(providing_args=["method", "url", "uuid"])
