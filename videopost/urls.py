from django.urls import path

from . import views

app_name = 'videopost'

urlpatterns = [
    path('assignid/', views.assign_unique_id, name='assign_unique_id'),
    path('', views.IndexView.as_view(), name='index'),
    path('serch', views.SerchView.as_view(), name='serch'),
    path('edit', views.EditView.as_view(), name='edit'),
    path('check', views.CheckView.as_view(), name='check'),
    path('saveDraft/', views.save_draft, name='save_draft'),
    path('trim/', views.trim_video, name='trim_video'),
    path('posting/', views.posting_video, name='posting_video'),
    path('vpost/', views.video_post, name='video_post'),
    path('account', views.AccountView.as_view(), name='account'),
    path('savenameoraddress/', views.saveNameOrAddress, name="savenoa"),
    path('deletevideo/', views.delete_video, name="delete_video"),
    path('mintvideo/', views.mint_video, name='mint_video'),
    path('getTags/', views.get_tags, name="get_tags"),
    path('testIpfs/', views.test_ipfs, name="test_ipfs"),
    path('test/', views.test, name='test')
]

"""    
    path('ipost/', views.image_post, name='image_post'),
    path('delete/', views.delete_materials, name='delete'),
    path('saveBackup/', views.save_backup, name='save_backup'),"""
