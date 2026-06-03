from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("videopost", "0032_alter_video_price"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="whenClick",
            new_name="WhenClick",
        ),
    ]
