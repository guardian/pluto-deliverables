# Generated by Django 3.1 on 2020-08-26 12:29

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('gnm_deliverables', '0002_auto_20200814_0910'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailymotion',
            name='etag',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AddField(
            model_name='gnmwebsite',
            name='etag',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AddField(
            model_name='mainstream',
            name='etag',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AddField(
            model_name='youtube',
            name='etag',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='deliverableasset',
            name='DailyMotion_master',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='gnm_deliverables.dailymotion'),
        ),
        migrations.AlterField(
            model_name='deliverableasset',
            name='gnm_website_master',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='gnm_deliverables.gnmwebsite'),
        ),
        migrations.AlterField(
            model_name='deliverableasset',
            name='mainstream_master',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='gnm_deliverables.mainstream'),
        ),
        migrations.AlterField(
            model_name='deliverableasset',
            name='youtube_master',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='gnm_deliverables.youtube'),
        ),
    ]