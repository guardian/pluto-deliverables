from django.db.models import Model, TextField, IntegerField, BooleanField, UUIDField
from django.core.validators import RegexValidator
# {"title": "dsa", "type": "video-upload", "assetVersion": -1, "projectId": "VX-600",
# "enabled": true, "s3Key": "uploads/b98cf3c2-f56f-4a01-a2c8-acac4ad1e8d7--d60d06e4-0562-4558-b6f8-e7e924908201/complete",
# "atomId": "b98cf3c2-f56f-4a01-a2c8-acac4ad1e8d7",
# "user": "joe.bloggs@mydomain.com"}


class AtomResponderMessage(Model):
    """
    represents the message coming from atom responder.
    it's not stored in the database, but done like this to take advantage of rest_framework's serializers
    """
    title = TextField(max_length=32768)
    type = TextField(max_length=128)
    projectId = TextField(max_length=128)
    atomId = UUIDField()
    user = TextField(max_length=32768)
    jobId = TextField(max_length=128, validators=[RegexValidator(r'^\w{2}-\d+')])
    itemId = TextField(max_length=128, validators=[RegexValidator(r'^\w{2}-\d+')])