from django.contrib import admin
from .models import Video,Tag,TagMap,whenClick

# Register your models here.

admin.site.register(Video)
admin.site.register(Tag)
admin.site.register(TagMap)
admin.site.register(whenClick)