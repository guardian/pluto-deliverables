

from django.core.exceptions import ValidationError
from django.forms import ModelForm

from .files import is_valid_dir_name
from .models import Deliverable, DeliverableAsset


class DeliverableCreateForm(ModelForm):

    def clean_name(self):
        name = self.cleaned_data.get('name', None)
        if name is not None:
            invalid_char = is_valid_dir_name(name)
            if invalid_char:
                raise ValidationError('Invalid characters in name: {invalid_char}'.format(invalid_char=invalid_char))
        return name

    class Meta:
        model = Deliverable
        fields = 'name'.split()


class DeliverableAssetForm(ModelForm):
    class Meta:
        model = DeliverableAsset
        fields = 'id type'.split()
