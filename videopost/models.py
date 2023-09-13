from django.db import models
from cloudinary.models import CloudinaryField
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
    
class whenClick(models.Model):
    date = models.DateTimeField(auto_now_add=True)
    tagid = models.ForeignKey("Tag", on_delete=models.CASCADE, to_field="name")
    def get_total_value(self):
        total_value = self.objects.values_list("name", flat=True).aggregate(total=models.Sum('value'))['total']
        return total_value or 0