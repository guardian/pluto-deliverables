# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'Deliverable'
        db.create_table('gnm_deliverables_deliverable', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('project_id', self.gf('django.db.models.fields.CharField')(max_length=61)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=255)),
            ('created', self.gf('django.db.models.fields.DateTimeField')(auto_now_add=True, blank=True)),
        ))
        db.send_create_signal('gnm_deliverables', ['Deliverable'])

        # Adding model 'DeliverableAsset'
        db.create_table('gnm_deliverables_deliverableasset', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('type', self.gf('django.db.models.fields.PositiveIntegerField')(null=True, blank=True)),
            ('filename', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('absolute_path', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('size', self.gf('django.db.models.fields.BigIntegerField')(null=True, blank=True)),
            ('access_dt', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
            ('modified_dt', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
            ('changed_dt', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
            ('job_id', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('item_id', self.gf('django.db.models.fields.TextField')(null=True, blank=True)),
            ('ingest_complete_dt', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
            ('file_removed_dt', self.gf('django.db.models.fields.DateTimeField')(null=True, blank=True)),
            ('deliverable', self.gf('django.db.models.fields.related.ForeignKey')(related_name=u'assets', to=orm['gnm_deliverables.Deliverable'])),
        ))
        db.send_create_signal('gnm_deliverables', ['DeliverableAsset'])

        # Adding unique constraint on 'DeliverableAsset', fields ['deliverable', 'type']
        db.create_unique('gnm_deliverables_deliverableasset', ['deliverable_id', 'type'])


    def backwards(self, orm):
        # Removing unique constraint on 'DeliverableAsset', fields ['deliverable', 'type']
        db.delete_unique('gnm_deliverables_deliverableasset', ['deliverable_id', 'type'])

        # Deleting model 'Deliverable'
        db.delete_table('gnm_deliverables_deliverable')

        # Deleting model 'DeliverableAsset'
        db.delete_table('gnm_deliverables_deliverableasset')


    models = {
        'gnm_deliverables.deliverable': {
            'Meta': {'object_name': 'Deliverable'},
            'created': ('django.db.models.fields.DateTimeField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '255'}),
            'project_id': ('django.db.models.fields.CharField', [], {'max_length': '61'})
        },
        'gnm_deliverables.deliverableasset': {
            'Meta': {'unique_together': "((u'deliverable', u'type'),)", 'object_name': 'DeliverableAsset'},
            'absolute_path': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'access_dt': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'changed_dt': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'deliverable': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "u'assets'", 'to': "orm['gnm_deliverables.Deliverable']"}),
            'file_removed_dt': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'filename': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'ingest_complete_dt': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'item_id': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'job_id': ('django.db.models.fields.TextField', [], {'null': 'True', 'blank': 'True'}),
            'modified_dt': ('django.db.models.fields.DateTimeField', [], {'null': 'True', 'blank': 'True'}),
            'size': ('django.db.models.fields.BigIntegerField', [], {'null': 'True', 'blank': 'True'}),
            'type': ('django.db.models.fields.PositiveIntegerField', [], {'null': 'True', 'blank': 'True'})
        }
    }

    complete_apps = ['gnm_deliverables']