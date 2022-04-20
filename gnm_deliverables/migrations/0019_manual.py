from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gnm_deliverables', '0018_manual'),
    ]

    operations = [
        migrations.AddField(
            model_name='youtubecategories',
            name='identity',
            field=models.CharField(max_length=64, blank=True, null=True),
        ),
    ]
