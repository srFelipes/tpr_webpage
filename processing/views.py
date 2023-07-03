from django.contrib import admin
from django.http import HttpResponse, JsonResponse, HttpResponseNotFound
from django.conf import settings
from django.urls import include, path, re_path
from django.conf import settings
import pymysql

from . import queries
from interface import views as views
from .models import Nodeaddress, Nodedata
from interface import urls

def dispatcher(request):

    db_conn = pymysql.connect(
        host       =     settings.DB_HOSTNAME,
        user       =     settings.DB_USER,
        password   =     settings.DB_PASSWORD,
        db         =     settings.DB_PLACES,
        port       = int(settings.DB_PORT)
    )
    cur = db_conn.cursor()
    cur.execute('SELECT * FROM ' + settings.DB_PLACES + ';')
    places = []

    # class DefaultAddress(Nodeaddress):
    #     class Meta:
    #         proxy = True

    # class defaultAdmin(admin.ModelAdmin):
    #     using = ''
    #     def get_queryset(self, request):
    #         return super().get_queryset(request).using(self.using)

    for row in cur:
        places.append(row[1])
        # temp = {
        #     'ENGINE': 'django.db.backends.mysql',
        #     'NAME': row[1],
        #     'USER': settings.DB_USER['Parameter']['Value'],
        #     'PASSWORD': settings.DB_PASSWORD['Parameter']['Value'],
        #     'HOST': settings.DB_HOSTNAME['Parameter']['Value'],
        #     'PORT': settings.DB_PORT['Parameter']['Value'],
        #     'OPTIONS': {
        #         'sql_mode': 'traditional',
        #     }
        # }
        # settings.CLASSES_ADMINS.update({
        #     row[1] : type(
        #         row[1]+'Admin',
        #         (defaultAdmin,),
        #         {'using' : row[1]}
        #     )})
        # settings.CLASSES_ADDRESS.update({
        #     row[1] : type(
        #         row[1]+'Address',
        #         (DefaultAddress,),
        #         {'__module__': __name__}
        #     )})
        # print(settings.CLASSES_ADMINS[row[1]].using)

        # settings.PLACES.append(row[1])
        # settings.DATABASES.update({row[1] : temp})
        # settings.PLACES_ADMINS.update({row[1] : admin.AdminSite(row[1])})
        # settings.PLACES_ADMINS[row[1]].register(settings.CLASSES_ADDRESS[row[1]], settings.CLASSES_ADMINS[row[1]])
        # urls.urlpatterns.insert(0,path(row[1]+'/admin', settings.PLACES_ADMINS[row[1]].urls))
        # print(urls.urlpatterns)
    cur.close()

    query_url = request.path.split('/')

    place_query = query_url[1]
    if place_query not in places:
        return HttpResponseNotFound()
    if len(query_url) == 2:
        return views.index(request)
    if len(query_url) > 2:
        if query_url[2] == 'init_query':
            return queries.init_query(request)
        if query_url[2] == 'data_query':
            return queries.data_query(request)
        if query_url[2] == 'csv_query':
            return queries.csv_query(request)
        if query_url[2] == 'admin':
            return HttpResponseNotFound()