from django.db.models import Model, TextField, IntegerField, FloatField, BooleanField, UUIDField
from django.core.validators import RegexValidator


class AtomResponderMessage(Model):
    """
    represents the message coming from atom responder.
    it's not stored in the database, but done like this to take advantage of rest_framework's serializers
    """
    title = TextField(max_length=32768)
    type = TextField(max_length=128)
    projectId = TextField(max_length=128, null=True, blank=True)
    atomId = UUIDField()
    jobId = TextField(max_length=128, validators=[RegexValidator(r'^\w{2}-\d+')], null=True, blank=True)    #these must be blankable to handle "project reassignment" messages
    itemId = TextField(max_length=128)  #sometimes this is set to the atom uuid
    commissionId = IntegerField(null=True, blank=True)
    size = IntegerField(null=True, blank=True)
    mtime = FloatField(null=True, blank=True)
    ctime = FloatField(null=True, blank=True)
    atime = FloatField(null=True, blank=True)


class StoragetierSuccessMessage(Model):
    """
    represents the message coming from pluto-storagetier online->archive
    """
    archiveHunterID = TextField(max_length=32768)
    archiveHunterIDValidated = BooleanField()
    originalFilePath = TextField(max_length=32768)
    uploadedBucket = TextField(max_length=128)
    uploadedPath = TextField(max_length=32768)
    uploadedVersion = IntegerField(null=True, blank=True)
    vidispineItemId = TextField(max_length=128, null=True, blank=True)
    vidispineVersionId = IntegerField(null=True, blank=True)
    proxyBucket = TextField(max_length=128, null=True, blank=True)
    proxyPath = TextField(max_length=32768, null=True, blank=True)
    proxyVersion = IntegerField(null=True, blank=True)
    metadataXML = TextField(max_length=32768, null=True, blank=True)   # path to the XML, not the actual content!!
    metadataVersion = IntegerField(null=True, blank=True)


class CDSResponderMessage(Model):
    job_id = TextField(max_length=128)
    routename = TextField(max_length=256)
    deliverable_asset = TextField(max_length=128)
    deliverable_bundle = TextField(max_length=128)
