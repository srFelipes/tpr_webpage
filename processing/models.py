from django.db import models
from datetime import datetime

# Create your models here.
class Datafield(models.Model):
    update_time = models.DateTimeField()

class Nodeaddress(models.Model):
    node_address = models.IntegerField()
    node_frequency = models.FloatField(default=0.0)
    node_latitude = models.FloatField(default=0.0)
    node_longitude = models.FloatField(default=0.0)
    node_moist_min = models.FloatField(default=0.0)
    node_moist_max = models.FloatField(default=0.0)
    node_x_offset = models.FloatField(default=0.0)
    node_y_offset = models.FloatField(default=0.0)
    node_z_offset = models.FloatField(default=0.0)
    node_name = models.CharField(max_length=100)
    node_temp_function = models.CharField(max_length=255)
    node_active = models.BooleanField(default=True)
    node_display = models.BooleanField(default=True)

class Nodedata(models.Model):
    moist_value = models.FloatField(default=0.0)
    volt_value = models.FloatField(default=0.0)
    temp_value = models.FloatField(default=0.0)
    acc_x_value = models.FloatField(default=0.0)
    acc_y_value = models.FloatField(default=0.0)
    acc_z_value = models.FloatField(default=0.0)
    mag_x_value = models.FloatField(default=0.0)
    mag_y_value = models.FloatField(default=0.0)
    mag_z_value = models.FloatField(default=0.0)
    rssi_value = models.FloatField(default=0.0)
    fei_value = models.FloatField(default=0.0)
    snr_value = models.FloatField(default=0.0)
    flags_value = models.FloatField(default=0.0)
    status_value = models.CharField(max_length=100)
    datatime = models.DateTimeField()
    address_value = models.ForeignKey(Nodeaddress, on_delete=models.CASCADE, null=True)
    updatetime_value = models.ForeignKey(Datafield, on_delete=models.CASCADE, null=True)

