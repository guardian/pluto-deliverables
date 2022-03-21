from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rabbitmq', '0008_storagetiersuccessmessage'),
    ]

    operations = [
        migrations.CreateModel(
            name='CDSResponderMessage',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('job_id', models.TextField(max_length=128)),
                ('routename', models.TextField(max_length=256)),
                ('deliverable_asset', models.TextField(max_length=128)),
                ('deliverable_bundle', models.TextField(max_length=128)),
            ],
        ),
    ]