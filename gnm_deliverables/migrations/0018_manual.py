from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gnm_deliverables', '0017_manual'),
    ]

    operations = [
        migrations.CreateModel(
            name='YouTubeCategories',
            fields=[
                ('title', models.CharField(max_length=1024)),
            ],
        ),
    ]
