from django.conf import settings
from django.shortcuts import render,redirect
from django.views.generic import TemplateView
from django.http import JsonResponse
from django.urls import reverse
from django.core.signals import request_finished
from django.core.files.base import ContentFile
from django.core.files.storage import FileSystemStorage
from django.db import connection
from django.views.generic import CreateView,ListView
from .models import Video,Tag
from .forms import VideoForm
import os
import base64
import moviepy.editor
import uuid
import shutil

# Create your views here.
def create_unique_id(request):
        unique_id = uuid.uuid4()
        request.session['user_id'] = str(unique_id)

def unique_id_assignment(request):
    if 'user_id' not in request.session:
        create_unique_id(request)
    return redirect("index")

class IndexView(ListView):
    model = Video
    template_name = 'index.html'
    paginate_by = 10
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "インデックス"
        return context
    
    def get_queryset(self):
        return self.model.objects.all().order_by('-uploaded')

class SerchView(TemplateView):
    template_name = 'serch.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "サーチ"
        return context
    
class EditView(CreateView):
    model = Video
    form_class = VideoForm
    template_name = 'edit.html'

    def get_context_data(self, **kwargs):
        context = super(EditView, self).get_context_data(**kwargs)
        context["title"] = "エディット"
        return context
    
    def get_success_url(self):
        return reverse('videopost:check')
    
class CheckView(TemplateView):
    template_name = 'check.html'
    
    def get_context_data(self, **kwargs):
        context = super(CheckView, self).get_context_data(**kwargs)
        context['title'] = "チェック"
        return context
    
def save_draft(request):
    if request.method == "POST":
        print(request.POST.get("draft"))
        request.session["draft"] = request.POST.get("draft")
    return JsonResponse({"draft":"success"})

def get_tags(request):
    tags = list(Tag.objects.values_list("name", flat=True))
    print(tags)
    print(Tag.objects.filter(name__contains="test1"))
    return JsonResponse({"tags":tags})

class VideoView(TemplateView):
    template_name = 'video.html'
    
def video_post(request):
    if request.method == 'POST':
        video_file = request.FILES.get('videoData')  # 動画ファイルを取得
        print(request.POST)
        print(request.FILES)
        print(video_file)
        print(type(settings.STATIC_ROOT))
        if video_file:
            if 'user_id' not in request.session:
                create_unique_id(request)
            id = request.session.get('user_id')
            print(id)
            print(type(id))
            path = os.path.join(settings.STATIC_ROOT,'materials',id)
            fs = FileSystemStorage(location=path)
            fs.save(video_file.name,video_file)
            path = fs.path(video_file.name)
            if 'starttime' in list(request.POST):
                start_time = request.POST.get('starttime')
                end_time = request.POST.get('endtime')
                video = moviepy.editor.VideoFileClip(path)
                clipped_video = video.subclip(start_time, end_time)
                clipped_video.write_videofile(path)
            path = "\\"+os.path.join(*path.split('\\')[3:])
        return JsonResponse({'path':path})
                    
def image_post(request):
    if request.method == 'POST':
        image_data = request.POST.get('photo')
        format, imgstr = image_data.split(';base64,')
        ext = format.split('/')[-1]
        image_data = base64.b64decode(imgstr)
        file = ContentFile(image_data)
        name = request.POST.get('name')+'.'+ext
        id = request.session.get('user_id')
        path = os.path.join(settings.STATIC_ROOT,'materials',id)
        fs = FileSystemStorage(location=path)
        fs.save(name,file)
        path = fs.path(name)
        path = "\\"+os.path.join(*path.split('\\')[3:])

        
        return JsonResponse({'path':path})

def delete_materials(request):
    id = request.session.get('user_id')
    path = os.path.join(settings.STATIC_ROOT,'materials',id)
    if os.path.exists(path):
        shutil.rmtree(path)
    print("deleted")
    return redirect('/videopost/edit')

def save_backup(request):
    print("r")
    if request.method == "POST":
        print(request.POST)
        print(request.POST.get("backup_materials"))
        print(request.POST.get("backup_previews"))
        request.session["backup_materials"] = request.POST.get("backup_materials")
        request.session["backup_previews"] = request.POST.get("backup_previews")
        request.session["backup_width"] = request.POST.get("backup_width")
        return JsonResponse({"backup": "success"})