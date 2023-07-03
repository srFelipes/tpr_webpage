"""
Django settings for interface project.
"""

import pymysql
import os
import boto3

ssm = boto3.client('ssm', region_name=os.environ['REGION'])
DB_NAME = os.environ['DB_NAME']
DB_USER = os.environ['DB_USER']
DB_PASSWORD = os.environ['DB_PASSWORD']
DB_HOSTNAME = os.environ['DB_HOSTNAME']
DB_PORT = os.environ['DB_PORT']
DB_PLACES = os.environ['DB_PLACES']

PLACES_ADMINS = {}
CLASSES_ADMINS = {}
CLASSES_ADDRESS = {}

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SECRET_KEY = os.environ['SECRET_KEY']

DEBUG = True

ALLOWED_HOSTS = ['*']

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'storages',
    'filters',
    'html_templates',
    'processing',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'interface.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, "filters/templatetags"),
                 os.path.join(BASE_DIR, "html_templates/partials"),
                 os.path.join(BASE_DIR, "html_templates/img"),
                 os.path.join(BASE_DIR, "html_templates/views"),
                ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'interface.wsgi.application'

# Database

db_conn = pymysql.connect(
    host       =     DB_HOSTNAME,
    user       =     DB_USER,
    password   =     DB_PASSWORD,
    db         =     DB_PLACES,
    port       = int(DB_PORT)
)

cur = db_conn.cursor()

cur.execute('SELECT * FROM ' + DB_PLACES + ';')

DATABASES = {
    'default' :
    {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': DB_NAME,
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOSTNAME,
        'PORT': DB_PORT,
        'OPTIONS': {
            'sql_mode': 'traditional',
        }
    }
}

for row in cur:
    temp = {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': row[1],
        'USER': DB_USER,
        'PASSWORD': DB_PASSWORD,
        'HOST': DB_HOSTNAME,
        'PORT': DB_PORT,
        'OPTIONS': {
            'sql_mode': 'traditional',
        }
    }
    DATABASES.update({row[1] : temp})

cur.close()

# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'America/Santiago'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)

AWS_ACCESS_KEY_ID = os.environ['AWS_ACCESS_KEY_ID']
AWS_SECRET_ACCESS_KEY = os.environ['AWS_SECRET_ACCESS_KEY']
AWS_STORAGE_BUCKET_NAME = os.environ['AWS_STORAGE_BUCKET_NAME']
AWS_S3_CUSTOM_DOMAIN = '%s.s3-%s.amazonaws.com' % (AWS_STORAGE_BUCKET_NAME, os.environ['REGION'])
AWS_S3_OBJECT_PARAMETERS = {
    'CacheControl': 'max-age=86400',
}
AWS_DEFAULT_ACL = None

AWS_LOCATION = 'static'
AWS_QUERYSTRING_AUTH = False

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static')
]
STATIC_URL = 'https://%s/%s/' % (AWS_S3_CUSTOM_DOMAIN, AWS_LOCATION)
STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

APPEND_SLASH = False

CSRF_COOKIE_SECURE = False
