from django.contrib import admin
from django.conf import settings

from .models import Nodeaddress, Nodedata

# class calanAdmin(admin.ModelAdmin):
#     using = 'calan'
#     def get_queryset(self, request):
#         # Tell Django to look for objects on the 'other' database.
#         return super().get_queryset(request).using(self.using)

# class san_jose_maipoAdmin(admin.ModelAdmin):
#     using = 'san_jose_maipo'
#     def get_queryset(self, request):
#         # Tell Django to look for objects on the 'other' database.
#         return super().get_queryset(request).using(self.using)

# class calanAddress(Nodeaddress):
#     class Meta:
#         proxy = True

# class san_jose_maipoAddress(Nodeaddress):
#     class Meta:
#         proxy = True

# calan_admin_site = admin.AdminSite('calan')
# san_jose_maipo_admin_site = admin.AdminSite('san_jose_maipo')

# calan_admin_site.register(calanAddress, calanAdmin)
# san_jose_maipo_admin_site.register(san_jose_maipoAddress, san_jose_maipoAdmin)