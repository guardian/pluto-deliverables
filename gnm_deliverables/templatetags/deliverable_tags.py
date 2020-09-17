from django import template

register = template.Library()


def sizeof_fmt(num, suffix='B'):
    if num is None:
        return "(none)"
    for unit in ['', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi']:
        if abs(num) < 1024.0:
            return "%3.1f %s%s" % (num, unit, suffix)
        num /= 1024.0
    return "%.1f %s%s" % (num, 'Yi', suffix)


register.filter("sizeof_fmt", sizeof_fmt)
