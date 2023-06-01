from django.urls import path

from . import views

app_name = 'videopost'

urlpatterns = [
    path('',views.IndexView.as_view(), name='index'),
    path('serch',views.SerchView.as_view(), name='serch'),
    path('edit',views.EditView.as_view(), name='edit'),
    path('check',views.CheckView.as_view(), name='check'),
]