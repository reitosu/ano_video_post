# Generated by Django 4.2.1 on 2023-09-12 17:49

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('videopost', '0003_tags_tagsmap_videos_delete_video_tagsmap_videoid'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='Tags',
            new_name='Tag',
        ),
        migrations.RenameModel(
            old_name='TagsMap',
            new_name='TagMap',
        ),
        migrations.RenameModel(
            old_name='Videos',
            new_name='Video',
        ),
    ]
