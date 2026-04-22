import os
from pathlib import Path
from datetime import timedelta
<<<<<<< HEAD
<<<<<<< HEAD
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = os.getenv('SECRET_KEY')
=======
=======
>>>>>>> a9a5fba (Smart Log inti)

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-qc-app-2026-change-me-in-production'
<<<<<<< HEAD
>>>>>>> a9a5fba (Smart Log inti)
=======
>>>>>>> a9a5fba (Smart Log inti)
DEBUG = True
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

ROOT_URLCONF = 'qc_project.urls'

DATABASES = {
    'default': {
        'ENGINE': 'mssql',
<<<<<<< HEAD
<<<<<<< HEAD
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '1433'),
=======
=======
>>>>>>> a9a5fba (Smart Log inti)
        'NAME': 'Smart Log DB',
        'USER': 'RMAdmin',
        'PASSWORD': 'QC@egpi#RM',
        'HOST': '10.0.100.175',
        'PORT': '1433',
<<<<<<< HEAD
>>>>>>> a9a5fba (Smart Log inti)
=======
>>>>>>> a9a5fba (Smart Log inti)
        'OPTIONS': {
            'driver': 'ODBC Driver 17 for SQL Server',
            'extra_params': 'TrustServerCertificate=yes',
        },
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'api.authentication.CustomJWTAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 30,
    'EXCEPTION_HANDLER': 'api.exception_handler.custom_exception_handler',
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=10),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_TZ = False
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

STATIC_URL = '/static/'
<<<<<<< HEAD
<<<<<<< HEAD
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, '..', 'frontend'),
]
=======
>>>>>>> a9a5fba (Smart Log inti)
=======
>>>>>>> a9a5fba (Smart Log inti)
