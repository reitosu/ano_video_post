from django.apps import AppConfig


class VideopostConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'videopost'
    
    def ready(self):
        from videopost import signals
