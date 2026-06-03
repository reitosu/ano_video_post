from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Tag, TagMap, WhenClick


@receiver(post_save, sender=TagMap)
def update_totalvalue_on_save(sender, instance, **kwargs):
    tag = instance.tagid
    Tag.objects.update_or_create(name=tag.name, defaults={"totalvalue": tag.totalvalue + 1})


@receiver(post_delete, sender=TagMap)
def update_totalvalue_on_delete(sender, instance, **kwargs):
    tag = instance.tagid
    Tag.objects.update_or_create(name=tag.name, defaults={"totalvalue": tag.totalvalue + 1})


@receiver(post_save, sender=WhenClick)
def update_clickvalue_on_save(sender, instance, **kwargs):
    tag = instance.tagid
    Tag.objects.update_or_create(name=tag.name, defaults={"clickvalue": tag.clickvalue + 1})


@receiver(post_delete, sender=WhenClick)
def update_clickvalue_on_delete(sender, instance, **kwargs):
    tag = instance.tagid
    Tag.objects.update_or_create(name=tag.name, defaults={"clickvalue": tag.clickvalue - 1})
