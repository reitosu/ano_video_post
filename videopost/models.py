from django.db import models
from cloudinary.models import CloudinaryField
from django.utils import timezone
# Create your models here.


class whenClickQuerySet(models.QuerySet):
    def get_tag_click_value_per_day(self, tag_name=""):
        query_set = self.get_queryset()
        now = timezone.now()
        one_day_ago = now - timezone.timedelta(days=1)
        if tag_name:
            li = list(query_set.filter(date__gte=one_day_ago, date__lte=now).values(
                "tagid").annotate(models.Count("tagid")))
            di = {}
            list(map(lambda x: di.update({x["tagid"]: x["tagid__count"]}), li))
            return di
        else:
            return query_set.filter(date__gte=one_day_ago, date__lte=now, tagid__exact=tag_name).count()


class VideoClickQuerySet(models.QuerySet):
    def get_tag_upload_value(self, tag_name=""):
        query_set = self.get_queryset()
        now = timezone.now()
        one_day_ago = now - timezone.timedelta(days=1)
        if tag_name:
            return list(query_set.filter(uploaded__gte=one_day_ago, uploaded__lte=now))
        else:
            return query_set.filter(tagid__exact=tag_name).count()


class Tag(models.Model):
    name = models.CharField(max_length=50, primary_key=True)
    totalvalue = models.IntegerField(default=0)
    clickvalue = models.IntegerField(default=0)


class Video(models.Model):
    title = models.CharField(max_length=30, unique=True)
    video = CloudinaryField(resource_type='video')
    uploaded = models.DateTimeField(auto_now_add=True)
    uploader = models.CharField(max_length=50)


class TagMap(models.Model):
    videoid = models.ForeignKey(
        "Video", on_delete=models.CASCADE, to_field="title")
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")


class whenClick(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")
    query = whenClickQuerySet.as_manager()
