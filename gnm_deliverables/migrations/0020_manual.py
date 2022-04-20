from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gnm_deliverables', '0019_manual'),
    ]

    operations = [
        migrations.CreateModel(
            name='YouTubeChannels',
            fields=[
                ('title', models.CharField(max_length=1024)),
                ('identity', models.CharField(max_length=128, blank=True, null=True)),
            ],
        ),
    ]
