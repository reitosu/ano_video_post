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
<<<<<<< HEAD
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")
=======
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")
<<<<<<< HEAD
    
    def get_tag_click_value_per_day(self,tag_name=""):
        now = timezone.now()
        one_day_ago = now - timezone.timedelta(days=1)
        if tag_name:
            li = list(self.objects.filter(date__gte=one_day_ago, date__lte=now).values("tagid").annotate(models.Count("tagid")))
            di = {}
            list(map(lambda x: di.update({x["tagid"]:x["tagid__count"]}), li))
            return di
        else:
            return self.objects.filter(date__gte=one_day_ago, date__lte=now,tagid__exact=tag_name).count()
            
    def get_tag_click_value(self,tag_name=""):
        if tag_name:
            di = {}
            list(map(lambda x: di.update({x["tagid"]:x["tagid__count"]}),list(self.objects.values('tagid').annotate(models.Count("tagid")))))
            return di
        else:
            self.objects.filter(tagid__exact=tag_name).count()
>>>>>>> cedf199cb3e896a44663605c1013de472d640073
=======
    query = whenClickQuerySet.as_manager()
>>>>>>> 26cc031aad279610e7fe70c19e19e8d27cf903a6
