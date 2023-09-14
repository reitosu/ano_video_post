from django.db import models
from cloudinary.models import CloudinaryField
from django.utils import timezone
# Create your models here.

class Tag(models.Model):
    name = models.CharField(max_length=50, primary_key=True)

class Video(models.Model):
    title = models.CharField(max_length=30, unique=True)
    video = CloudinaryField(resource_type='video')
    uploaded = models.DateTimeField(auto_now_add=True)
    
class TagMap(models.Model):
    videoid = models.ForeignKey("Video", on_delete=models.CASCADE, to_field="title")
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")
    
    def get_tag_total_value(self,tag_name=""):
        if tag_name:
            di = {}
            list(map(lambda x: di.update({x["tagid"]:x["tagid__count"]}),list(self.objects.values('tagid').annotate(models.Count("tagid")))))
            return di
        else:
            return self.objects.filter(tagid__exact=tag_name).count()
    
class whenClick(models.Model):
    date = models.DateTimeField(auto_now_add=True)
<<<<<<< HEAD
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")
=======
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")
    
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
