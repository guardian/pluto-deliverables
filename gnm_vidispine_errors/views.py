# coding: utf-8
from portal.generic.baseviews import ClassView


class ErrorView(ClassView):
    '''
    View that takes a Http status code and renders the correct error page.
    Assuming there was an error, if not, a page indicating it was not an error is displayed.

    Primairly used by browser scripts communication directly with Vidispine.
    '''
    def __call__(self):
        from portal.plugins.gnm_vidispine_errors.error_handling import is_error, handle_errors
        from django.shortcuts import render
        from django.http import Http404

        vs_path = self.kwargs.get('vidispine_path')
        status_code = self.kwargs.get('status_code')
        if status_code is None or vs_path is None:
            raise Http404
        status_code = int(status_code)

        if is_error(status_code):
            return handle_errors(status_code=status_code, request=self.request, vidispine_path=vs_path)
        return render(self.request, template_name='gnm_vidispine_errors/not_an_error.html')
