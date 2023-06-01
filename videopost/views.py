from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import HttpResponse

# Create your views here.
class IndexView(TemplateView):
    template_name = 'index.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "インデックス"
        return context

class SerchView(TemplateView):
    template_name = 'serch.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "サーチ"
        return context
    
class EditView(TemplateView):
    template_name = 'edit.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "エディット"
        return context
    
class CheckView(TemplateView):
    template_name = 'check.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "チェック"
        return context

def index(request):
    return HttpResponse("Hello World")