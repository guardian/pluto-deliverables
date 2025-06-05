from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('rabbitmq', '0010_manual'),
    ]

    operations = [
        migrations.AddField(
            model_name='atomrespondermessage',
            name='path',
            field=models.TextField(max_length=2048),
        ),
    ]