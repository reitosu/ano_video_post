# Generated by Django 4.2.1 on 2023-10-17 00:48

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("videopost", "0016_alter_account_accountid_alter_account_privatekey"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="account",
            name="privatekey",
        ),
        migrations.AddField(
            model_name="account",
            name="walletadress",
            field=models.CharField(max_length=50, null=True),
        ),
    ]