# Generated by Django 4.2.1 on 2023-09-14 17:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('videopost', '0005_remove_tag_clickvalue_remove_tag_totalvalue_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='tag',
            name='clickvalue',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='tag',
            name='totalvalue',
            field=models.IntegerField(default=0),
        ),
    ]
