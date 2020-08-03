# coding: utf-8


class VSException(Exception):
    '''
    Base Vidispine Exception.
    '''
    def __init__(self, msg, response):
        '''
        Create new VSException instance.

        Keyword arguments:
            msg -- error message
            response -- HttpResponse from Vidispine triggering this exception.
        '''
        self.response = response
        self.msg = msg
        super(VSException, self).__init__(self, msg)

    def __unicode__(self):
        try:
            content = self.response.json()
        except ValueError:
            content = self.response.content
        return "{0} (status code {1}): {2}".format(self.msg, self.response.status_code, content)

    def __str__(self):
        return str(self.__unicode__())

    def extra_context(self):
        """
        returns a dictionary of extra context from the response
        :return:
        """
        from requests import Response

        if not isinstance(self.response, Response):
            return {}

        return {
            "response_body": self.response.text,
            "response_headers": self.response.headers,
            "response_status": self.response.status_code,
            "response_url": self.response.url
        }


class VSHttp404(VSException):
    '''
    Vidispine returned Http 404
    '''
    pass


class VSHttp403(VSException):
    '''
    Vidispine returned Http 403
    '''
    pass


class VSHttpUnexpectedStatus(VSException):
    '''
    Vidispine returned a statuscode that was unexpected but not handled specifically.
    Only raise this exception if the status code does not have a unique exception.
    '''
    pass
