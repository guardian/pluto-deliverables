from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gnm_deliverables', '0016_auto_20211201_1538'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailymotion',
            name='routename',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='mainstream',
            name='routename',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='dailymotion',
            name='job_id',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='mainstream',
            name='job_id',
            field=models.TextField(null=True, blank=True),
        ),
    ]
