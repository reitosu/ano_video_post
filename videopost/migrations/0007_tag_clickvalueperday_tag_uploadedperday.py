# Generated by Django 4.2.1 on 2023-09-15 07:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('videopost', '0006_tag_clickvalue_tag_totalvalue'),
    ]

    operations = [
        migrations.AddField(
            model_name='tag',
            name='clickvalueperday',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='tag',
            name='uploadedperday',
            field=models.IntegerField(default=0),
        ),
    ]
