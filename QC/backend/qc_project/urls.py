from django.urls import path, include
from django.http import HttpResponse
from pathlib import Path

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / 'frontend'

def serve_frontend(request):
    html_path = FRONTEND_DIR / 'index.html'
    return HttpResponse(html_path.read_bytes(), content_type='text/html')

urlpatterns = [
    path('api/', include('api.urls')),
    path('', serve_frontend, name='frontend'),
]
