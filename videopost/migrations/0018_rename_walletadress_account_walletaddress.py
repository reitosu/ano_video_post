# Generated by Django 4.2.1 on 2023-10-17 00:50

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("videopost", "0017_remove_account_privatekey_account_walletadress"),
    ]

    operations = [
        migrations.RenameField(
            model_name="account",
            old_name="walletadress",
            new_name="walletaddress",
        ),
    ]
