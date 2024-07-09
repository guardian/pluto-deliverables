from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gnm_deliverables', '0020_manual'),
    ]

    operations = [
        migrations.AddField(
            model_name='GNMWebsite',
            name='source',
            field=models.TextField(blank=True, null=True),
        ),
    ]
