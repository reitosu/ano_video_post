from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Tag,TagMap,whenClick

@receiver(post_save, sender=TagMap)
def update_totalvalue(sender, instance, **kwargs):
    tag = instance.tagid
    Tag.objects.update_or_create(name=tag.name, defaults={"totalvalue":tag.totalvalue+1})

@receiver(post_delete, sender=TagMap)
def update_totalvalue(sender, instance, **kwargs):
    tag = instance.tagid
    Tag.objects.update_or_create(name=tag.name, defaults={"totalvalue":tag.totalvalue+1})

@receiver(post_save, sender=whenClick)
def update_clickvalue(sender, instance, **kwargs):
    tag = instance.tagid
    Tag.objects.update_or_create(name=tag.name, defaults={"clickvalue":tag.clickvalue+1})

@receiver(post_delete, sender=whenClick)
def update_clickvalue(sender, instance, **kwargs):
    tag = instance.tagid
    Tag.objects.update_or_create(name=tag.name, defaults={"clickvalue":tag.clickvalue-1})

