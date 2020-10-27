from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rabbitmq', '0004_auto_20200917_1048'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='atomrespondermessage',
            name='user',
        ),
    ]