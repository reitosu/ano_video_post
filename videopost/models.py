from django.db import models
from cloudinary.models import CloudinaryField
# Create your models here.

class Video(models.Model):
    title = models.CharField(max_length=255)
    video = CloudinaryField(resource_type='video')
    uploaded = models.DateTimeField(auto_now_add=True)