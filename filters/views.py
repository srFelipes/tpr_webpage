from django.http import HttpResponse
from django.template.loader import get_template

import datetime

def index(request):
    return HttpResponse("Hola")