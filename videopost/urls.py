from django.urls import path

from . import views

app_name = 'videopost'

urlpatterns = [
    path('',views.IndexView.as_view(), name='index'),
    path('serch',views.SerchView.as_view(), name='serch'),
    path('edit',views.EditView.as_view(), name='edit'),
    path('check',views.CheckView.as_view(), name='check'),
    path('edit/video',views.VideoView.as_view(), name='video'),
    path('vpost/', views.video_post, name='video_post'),
    path('ipost/',views.image_post, name='image_post'),
    path('delete/',views.delete_materials, name='delete'),
    path('saveBackup/',views.save_backup, name='save_backup')
]