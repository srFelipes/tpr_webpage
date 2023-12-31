# Generated by Django 2.0.5 on 2019-07-04 16:08

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Datafield',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('update_time', models.DateTimeField()),
            ],
        ),
        migrations.CreateModel(
            name='Nodeaddress',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('node_address', models.IntegerField()),
                ('node_frequency', models.FloatField(default=0.0)),
                ('node_latitude', models.FloatField(default=0.0)),
                ('node_longitude', models.FloatField(default=0.0)),
                ('node_moist_min', models.FloatField(default=0.0)),
                ('node_moist_max', models.FloatField(default=0.0)),
                ('node_name', models.CharField(max_length=100)),
            ],
        ),
        migrations.CreateModel(
            name='Nodedata',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('moist_value', models.FloatField(default=0.0)),
                ('temp_value', models.FloatField(default=0.0)),
                ('acc_x_value', models.FloatField(default=0.0)),
                ('acc_y_value', models.FloatField(default=0.0)),
                ('acc_z_value', models.FloatField(default=0.0)),
                ('rssi_value', models.FloatField(default=0.0)),
                ('fei_value', models.FloatField(default=0.0)),
                ('snr_value', models.FloatField(default=0.0)),
                ('flags_value', models.FloatField(default=0.0)),
                ('status_value', models.CharField(max_length=100)),
                ('datatime', models.DateTimeField()),
                ('address_value', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='processing.Nodeaddress')),
                ('updatetime_value', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='processing.Datafield')),
            ],
        ),
    ]
