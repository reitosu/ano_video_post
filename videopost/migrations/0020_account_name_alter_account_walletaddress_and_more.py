# Generated by Django 4.2.1 on 2023-10-25 02:39

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("videopost", "0019_alter_whenclick_managers_video_tags"),
    ]

    operations = [
        migrations.AddField(
            model_name="account",
            name="name",
            field=models.CharField(blank=True, max_length=30),
        ),
        migrations.AlterField(
            model_name="account",
            name="walletaddress",
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.RemoveField(
            model_name="video",
            name="uploader",
        ),
        migrations.AddField(
            model_name="video",
            name="uploader",
            field=models.ManyToManyField(
                related_name="uploader", to="videopost.account"
            ),
        ),
    ]
