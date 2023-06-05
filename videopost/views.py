from django.shortcuts import render,redirect
from django.views.generic import TemplateView
from django.http import HttpResponse
from django.urls import reverse
from .models import Video
from django.views.generic import CreateView,ListView
from .forms import VideoForm

# Create your views here.

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
        context['videos'] = Video.objects.all().order_by('-uploaded')
        context['title'] = "チェック"
        return context
    
def index(request):
    return HttpResponse("Hello World")