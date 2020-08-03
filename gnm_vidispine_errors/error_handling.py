# coding: utf-8


def raise_error(response):
    '''
    Raises appropriate Vidispine exception depending on HTTP status code in response.

    NOTE: This method will do a best effort to handle any status code. It is up to the caller to assert that the status code
    provided actually represents and error.

    Keyword arguments:
        response -- A HttpResponse (from a Vidispine call)

    Raise:
        Exception depending on status code in response.
    '''
    from portal.plugins.gnm_vidispine_errors.exceptions import VSHttp403, VSHttp404, VSHttpUnexpectedStatus

    status_code = response.status_code
    if status_code == 404:
        raise VSHttp404('Vidispine returned 404', response=response)
    elif status_code == 403:
        raise VSHttp403('Vidispine returned 403', response=response)
    else:
        raise VSHttpUnexpectedStatus(
            'Vidispine returned {status_code}, content: {content}'.format(status_code=status_code, content=response.content),
            response=response
        )


def handle_errors(request, status_code, vidispine_path, send_ok_response=False):
    '''
    Display the correct error page according to the status code.

    Will log occurence.
    Will return rendered responseonse to show to the user. This responseonse will depend on the incomming status code.

    NOTE: This method will do a best effort to handle any status code. It is up to the caller to assert that the status code
    provided actually represents an error.

    Keywords arguments:
        status_code -- Http status code, used to determine which error page to display.
        request -- The HttpRequest triggering this page rendering.
        vidispine_path -- Vidispine URL (string) user tried to access triggering this error.
    '''
    from django.shortcuts import render
    import logging
    log = logging.getLogger(__name__)

    if send_ok_response:
        response_code = 200
    else:
        response_code = status_code

    log_msg = 'Vidispine Http {status_code} for {user} when accessing {vs_path} via portal {path}'.format(
        user=request.user,
        path=request.path,
        status_code=status_code,
        vs_path=vidispine_path
    )
    if status_code == 404:
        log.debug(log_msg)
        return render(request, template_name='gnm/templates/404.html', status=response_code)
    elif status_code == 403:
        log.debug(log_msg)
        return render(request, template_name='gnm/templates/403.html', status=response_code)

    log.error(log_msg)
    return render(request, template_name='gnm/templates/general_vidispine_error.html', status=response_code)


def log_vs_error_from_resp(resp):
    import logging
    log = logging.getLogger(__name__)

    username = resp.request.headers.get('RunAs', '')
    path = resp.url
    status = resp.status_code

    msg = 'Vidispine Http {status} for user {username} when accessing {path}'.format(status=status, username=username, path=path)
    log.error(msg)
    log.error('Full response:' + resp.content)


def is_error(status_code):
    '''
    Used to determine if a statuscode should be treated as OK or as an error.
    This method is thought to be used when processing Vidispine responses and nothing else.

    For now any HTTP-status code from 300 or above is treated as unexpected and therefore an error.

    Keywords arguments:
        status_code -- HTTP status code returned by Vidispine.

    Returns:
        Boolean indicating if an error occured:
            False - No error
            True - Error
    '''
    return 300 <= status_code
