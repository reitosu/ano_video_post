from django.shortcuts import render
from django.views.generic import TemplateView
from django.http import HttpResponse

# Create your views here.
class IndexView(TemplateView):
    template_name = 'index.html'

def index(request):
    return HttpResponse("Hello World")