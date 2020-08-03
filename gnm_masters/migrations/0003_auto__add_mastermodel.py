# -*- coding: utf-8 -*-
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'MasterModel'
        db.create_table('gnm_masters_mastermodel', (
            ('item_id', self.gf('django.db.models.fields.BigIntegerField')(primary_key=True)),
            ('user', self.gf('django.db.models.fields.related.ForeignKey')(related_name='master_user', to=orm['auth.User'])),
            ('title', self.gf('django.db.models.fields.TextField')()),
            ('created', self.gf('django.db.models.fields.DateTimeField')()),
            ('updated', self.gf('django.db.models.fields.DateTimeField')(auto_now=True, blank=True)),
            ('duration', self.gf('django.db.models.fields.TextField')(null=True)),
            ('commission', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gnm_commissions.CommissionModel'], null=True)),
            ('project', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['gnm_projects.ProjectModel'], null=True)),
            ('gnm_master_standfirst', self.gf('django.db.models.fields.TextField')(null=True)),
            ('gnm_master_website_headline', self.gf('django.db.models.fields.TextField')(null=True)),
            ('gnm_master_generic_status', self.gf('django.db.models.fields.TextField')(null=True)),
            ('holdingimage_16x9_url', self.gf('django.db.models.fields.TextField')(null=True)),
            ('gnm_master_generic_intendeduploadplatforms', self.gf('django.db.models.fields.TextField')(null=True)),
            ('gnm_master_generic_publish', self.gf('django.db.models.fields.DateTimeField')(null=True)),
            ('gnm_master_generic_remove', self.gf('django.db.models.fields.DateTimeField')(null=True)),
        ))
        db.send_create_signal('gnm_masters', ['MasterModel'])


    def backwards(self, orm):
        # Deleting model 'MasterModel'
        db.delete_table('gnm_masters_mastermodel')


    models = {
        'auth.group': {
            'Meta': {'object_name': 'Group'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '80'}),
            'permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'})
        },
        'auth.permission': {
            'Meta': {'ordering': "('content_type__app_label', 'content_type__model', 'codename')", 'unique_together': "(('content_type', 'codename'),)", 'object_name': 'Permission'},
            'codename': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'content_type': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['contenttypes.ContentType']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'auth.user': {
            'Meta': {'object_name': 'User'},
            'date_joined': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'email': ('django.db.models.fields.EmailField', [], {'max_length': '75', 'blank': 'True'}),
            'first_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'groups': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Group']", 'symmetrical': 'False', 'blank': 'True'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'is_active': ('django.db.models.fields.BooleanField', [], {'default': 'True'}),
            'is_staff': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'is_superuser': ('django.db.models.fields.BooleanField', [], {'default': 'False'}),
            'last_login': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            'last_name': ('django.db.models.fields.CharField', [], {'max_length': '30', 'blank': 'True'}),
            'password': ('django.db.models.fields.CharField', [], {'max_length': '128'}),
            'user_permissions': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.Permission']", 'symmetrical': 'False', 'blank': 'True'}),
            'username': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '30'})
        },
        'contenttypes.contenttype': {
            'Meta': {'ordering': "('name',)", 'unique_together': "(('app_label', 'model'),)", 'object_name': 'ContentType', 'db_table': "'django_content_type'"},
            'app_label': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'model': ('django.db.models.fields.CharField', [], {'max_length': '100'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '100'})
        },
        'gnm_commissions.commissionmodel': {
            'Meta': {'object_name': 'CommissionModel'},
            'collection_id': ('django.db.models.fields.BigIntegerField', [], {'primary_key': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {}),
            'gnm_commission_description': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_commission_googledriveurl': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_commission_owner': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'symmetrical': 'False'}),
            'gnm_commission_projecttype': ('django.db.models.fields.TextField', [], {}),
            'gnm_commission_status': ('django.db.models.fields.TextField', [], {}),
            'gnm_commission_title': ('django.db.models.fields.TextField', [], {}),
            'gnm_commission_workinggroup': ('django.db.models.fields.TextField', [], {}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'commission_user'", 'to': "orm['auth.User']"})
        },
        'gnm_masters.mastermodel': {
            'Meta': {'object_name': 'MasterModel'},
            'commission': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gnm_commissions.CommissionModel']"}),
            'created': ('django.db.models.fields.DateTimeField', [], {}),
            'duration': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_master_generic_intendeduploadplatforms': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_master_generic_publish': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'gnm_master_generic_remove': ('django.db.models.fields.DateTimeField', [], {'null': 'True'}),
            'gnm_master_generic_status': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_master_standfirst': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_master_website_headline': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'holdingimage_16x9_url': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'item_id': ('django.db.models.fields.BigIntegerField', [], {'primary_key': 'True'}),
            'project': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gnm_projects.ProjectModel']"}),
            'title': ('django.db.models.fields.TextField', [], {}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'master_user'", 'to': "orm['auth.User']"})
        },
        'gnm_masters.portalnlexml': {
            'Meta': {'object_name': 'PortalNleXml'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item_id': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '61'}),
            'updated': ('django.db.models.fields.DateTimeField', [], {})
        },
        'gnm_masters.signiantimport': {
            'Meta': {'object_name': 'SigniantImport'},
            'created': ('django.db.models.fields.DateField', [], {'auto_now_add': 'True', 'blank': 'True'}),
            'filename': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '65531'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'item_id': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '61'}),
            'job_id': ('django.db.models.fields.CharField', [], {'max_length': '61', 'null': 'True'}),
            'started': ('django.db.models.fields.DateField', [], {'null': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['auth.User']"}),
            'valid_filename': ('django.db.models.fields.BooleanField', [], {'default': 'False'})
        },
        'gnm_projects.projectmodel': {
            'Meta': {'object_name': 'ProjectModel'},
            'collection_id': ('django.db.models.fields.BigIntegerField', [], {'primary_key': 'True'}),
            'commission': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['gnm_commissions.CommissionModel']", 'null': 'True'}),
            'created': ('django.db.models.fields.DateTimeField', [], {}),
            'gnm_project_headline': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_project_prelude_file_item': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_project_project_file_item': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_project_standfirst': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_project_status': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_project_type': ('django.db.models.fields.TextField', [], {'null': 'True'}),
            'gnm_project_username': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['auth.User']", 'symmetrical': 'False'}),
            'updated': ('django.db.models.fields.DateTimeField', [], {'auto_now': 'True', 'blank': 'True'}),
            'user': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'project_user'", 'to': "orm['auth.User']"})
        }
    }

    complete_apps = ['gnm_masters']
