<<<<<<< HEAD
from django.urls import path, include, re_path
from django.http import HttpResponse
from django.views.static import serve
=======
from django.urls import path, include
from django.http import HttpResponse
>>>>>>> a9a5fba (Smart Log inti)
from pathlib import Path

FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / 'frontend'

def serve_frontend(request):
    html_path = FRONTEND_DIR / 'index.html'
    return HttpResponse(html_path.read_bytes(), content_type='text/html')

urlpatterns = [
    path('api/', include('api.urls')),
    path('', serve_frontend, name='frontend'),
<<<<<<< HEAD
    re_path(r'^(?P<path>.*)$', serve, {'document_root': FRONTEND_DIR}),
=======
>>>>>>> a9a5fba (Smart Log inti)
]
