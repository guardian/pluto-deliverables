from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rabbitmq', '0009_manual'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='CDSResponderMessage',
            name='job_id',
        ),
        migrations.AddField(
            model_name='CDSResponderMessage',
            name='job_name',
            field=models.TextField(max_length=128),
        ),
    ]