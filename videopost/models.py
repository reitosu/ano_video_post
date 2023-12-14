from django.db import models
from cloudinary.models import CloudinaryField
from django.utils import timezone
# Create your models here.


class TagQuerySet(models.QuerySet):
    def append_tag(self, tag):
        """
        append tag to TagModel

        Args:
            tag (str or list): tag to add
        """
        if type(tag) is str:
            tag = [tag]
        tag_objects = [Tag(name=tag_name) for tag_name in tag]
        self.bulk_create(objs=tag_objects, ignore_conflicts=True)
        return tag_objects


class WhenClickQuerySet(models.QuerySet):
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


class Account(models.Model):
    accountid = models.CharField(max_length=400, primary_key=True)
    walletaddress = models.CharField(max_length=50, blank=True, null=True)
    name = models.CharField(max_length=30, blank=True)


class DeviceMap(models.Model):
    accountid = models.ForeignKey(Account, on_delete=models.CASCADE)
    device = models.CharField(max_length=15)


class BrowserMap(models.Model):
    accountid = models.ForeignKey(Account, on_delete=models.CASCADE)
    browser = models.CharField(max_length=15)


class Tag(models.Model):
    name = models.CharField(max_length=50, primary_key=True)
    totalvalue = models.IntegerField(default=0)
    clickvalue = models.IntegerField(default=0)

    objects = TagQuerySet.as_manager()


class VideoQuerySet(models.QuerySet):
    def get_nft_metadata(self):
        """
        get nft metadata
        """
        return


class Video(models.Model):
    title = models.CharField(max_length=200, blank=True)
    description = models.CharField(max_length=1000, blank=True)
    video = CloudinaryField(resource_type='video')
    tags = models.ManyToManyField(Tag, related_name="tags", blank=True)
    uploaded = models.DateTimeField(auto_now_add=True)
    uploader = models.ManyToManyField(
        Account, related_name="uploader", blank=True)
    tokenid = models.IntegerField(null=True, blank=True)
    address = models.CharField(max_length=200, blank=True)
    price = models.FloatField(default=0)
    onedaydelete = models.BooleanField(default=False)
    ispublic = models.BooleanField(default=True)
    views = models.IntegerField(default=0)
    thumbsup = models.IntegerField(default=0)


class TagMap(models.Model):
    videoid = models.ForeignKey("Video", on_delete=models.CASCADE)
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")


class whenClick(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")

    objects = WhenClickQuerySet.as_manager()
