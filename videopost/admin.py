from django.contrib import admin
from .models import Video,Tag,TagMap,whenClick,Account,DeviceMap

# Register your models here.
class VideoAdmin(admin.ModelAdmin):
    filter_horizontal = ('tags', 'uploader')


admin.site.register(Video, VideoAdmin)
admin.site.register(Tag)
admin.site.register(TagMap)
admin.site.register(whenClick)
admin.site.register(Account)
admin.site.register(DeviceMap)