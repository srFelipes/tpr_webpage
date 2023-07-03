from django.http import HttpResponse, JsonResponse, HttpResponseNotFound
from django.template.loader import get_template
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from django.utils import dateparse
from django.utils import timezone
from django.conf import settings

from multiprocessing.connection import Client
from html_templates.views import dataFormatGate, dataFormatNode, dataFormatBase, dataFormatUnit
from processing.models import Datafield, Nodedata, Nodeaddress

import datetime
import json
import numpy as np
import pytz
import csv
from scipy import interpolate
from scipy import signal
from scipy.interpolate import Rbf
from scipy.interpolate import griddata

def coord2dist(x_in, y_in):
    earth_radius = 6373.0
    x = radians(x_in)
    y = radians(y_in)
    a = (sin((y[0] - x[0])/2))**2 + cos(x[1]) * cos(y[1]) * (sin((y[1] - x[1])/2))**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c
def val2moist(adc, min_val, max_val):
    return (100.0/(max_val - min_val))*(max_val - adc)
def val2temp(adc):
    return (10.888- np.sqrt((-10.888)**2 + 4*0.00347*(1777.3 - adc*1000)))/(2*-0.00347) + 30.0
def val2temp_tmp36(adc):
    return (adc - 0.5)*(50.0 - 0)/(1.0 - 0.5)
def temp2disc(adc):
    return (-10.888)**2 + 4*0.00347*(1777.3 - adc*1000)
def moist2cal(adc, temperature):
    return adc + (25.0 - 20) * 0.027/10.0

@csrf_exempt
def init_query(request):
    place_query = request.path.split('/')[1]
    database_to_use = place_query

    data_time = Datafield.objects.using(database_to_use).latest('id')
    nodes_object = Nodeaddress.objects.using(database_to_use).exclude(node_address=0).filter(node_display=True)
    nodes_values = list(Nodedata.objects.using(database_to_use).filter(address_value__node_display=True).filter(updatetime_value_id=data_time))
    gatew_object = Nodeaddress.objects.using(database_to_use).filter(node_address=0)
    data_out = {}

    data = {}
    for i in range(len(dataFormatNode)):
        data.update({i : dataFormatNode[i]})
    data_out.update({'strings' : data})

    data = {}
    for i in range(len(dataFormatUnit)):
        data.update({i : dataFormatUnit[dataFormatNode[i]]})
    data_out.update({'units' : data})

    data_out.update({'nodes_length' : len(nodes_object)})
    for i in range(len(nodes_object)):
        name = nodes_object[i].node_name
        coordinates = {
            'latitude' : nodes_object[i].node_latitude,
            'longitude' : nodes_object[i].node_longitude,
        }

        data = {}

        data.update({'name' : name})
        data.update({'coordinates' : coordinates})

        data_out.update({'node_' + str(i) : data})

    name = gatew_object[0].node_name
    coordinates = {
        'latitude' : gatew_object[0].node_latitude,
        'longitude' : gatew_object[0].node_longitude,
    }

    data = {}

    data.update({'name' : name})
    data.update({'coordinates' : coordinates})
    data_out.update({'gateway' : data})

    return JsonResponse(data_out, safe=False)

def data_query(request):
    place_query = request.path.split('/')[1]
    database_to_use = place_query
    interp_opt = request.GET['interp']
    map_opt = request.GET['map']
    node_opt = request.GET['node_n']
    volt_opt = request.GET['volt_disp']

    begin_date = request.GET['init_date']
    finish_date = request.GET['finish_date']

    begin_date = timezone.make_aware(timezone.datetime.strptime(begin_date, "%d/%m/%Y"))
    finish_date = timezone.make_aware(timezone.datetime.strptime(finish_date, "%d/%m/%Y")+timezone.timedelta(days=1))

    df = Datafield.objects.using(database_to_use).filter(update_time__gte=begin_date, update_time__lte = finish_date)
    df_len = len(df)

    if df_len == 0:
        df_0 = Datafield.objects.using(database_to_use).latest('id')
        df_dt = df_0.update_time

        begin_date = df_dt.replace(hour=0, minute=0, second=0, microsecond=0)
        finish_date = df_dt.replace(hour=23, minute=59, second=59, microsecond=999)

        df = Datafield.objects.using(database_to_use).filter(update_time__gte=begin_date, update_time__lte = finish_date)

    df_len = len(df)

    begin_n = df[0].id
    end_n = df[df_len-1].id

    nodes_object = Nodeaddress.objects.using(database_to_use).exclude(node_address=0).filter(node_display=True)

    if map_opt == 'Google':
        data_time = Datafield.objects.using(database_to_use).latest('id')

        data_out = {}
        data = {}
        for i in range(len(dataFormatNode)):
            data.update({i : dataFormatNode[i]})
        data_out.update({'strings' : data})

        data_out.update({'nodes_length' : len(nodes_object)})

        for i in range(len(nodes_object)):

            nodes_values = list(Nodedata.objects.using(database_to_use).filter(address_value__id=nodes_object[i].id).filter(updatetime_value_id=data_time))

            if nodes_values and nodes_values[0].status_value=='successful':
                moist_min = nodes_object[i].node_moist_min
                moist_max = nodes_object[i].node_moist_max
                x_offset= nodes_object[i].node_x_offset
                y_offset= nodes_object[i].node_y_offset
                z_offset= nodes_object[i].node_z_offset


                data = {}
                acc_x = nodes_values[0].acc_x_value
                acc_y = nodes_values[0].acc_y_value
                acc_z = nodes_values[0].acc_z_value
                mag_x = nodes_values[0].mag_x_value
                mag_y = nodes_values[0].mag_y_value
                mag_z = nodes_values[0].mag_z_value

                corr_x =  acc_z
                corr_y = -acc_y
                corr_z = -acc_x

                force = np.sqrt(np.power(corr_x, 2) + np.power(corr_y, 2) + np.power(corr_z, 2))
                elev = 90 - np.arccos(corr_z/force) * 180.0/np.pi
                if x_offset==0:
                    azim = np.arctan2(corr_y, corr_x) * 180.0/np.pi
                else:
                    azim = np.arctan2((mag_y-y_offset),(mag_x-x_offset)) * 180.0/np.pi

                exec('func = lambda adc : ' + nodes_object[i].node_temp_function, locals(), globals())
                data.update({dataFormatNode[0] : func(nodes_values[0].temp_value)})
                data.update({dataFormatNode[1] : nodes_values[0].volt_value})
                data.update({dataFormatNode[2] : val2moist(nodes_values[0].moist_value, moist_min, moist_max)})
                data.update({dataFormatNode[3] : corr_z})
                data.update({dataFormatNode[4] : elev})
                data.update({dataFormatNode[5] : azim})
                data.update({dataFormatNode[6] : nodes_values[0].snr_value})
                data.update({dataFormatNode[7] : nodes_values[0].rssi_value})
                data.update({dataFormatNode[8] : nodes_values[0].fei_value})
                data.update({dataFormatNode[9] : nodes_values[0].flags_value})
                data.update({dataFormatNode[10] : nodes_values[0].status_value})
                data_out.update({'node_' + str(i) : data})
            else:
                data = {}
                data.update({dataFormatNode[0] : 0.0})
                data.update({dataFormatNode[1] : 0.0})
                data.update({dataFormatNode[2] : 0.0})
                data.update({dataFormatNode[3] : 0.0})
                data.update({dataFormatNode[4] : 0.0})
                data.update({dataFormatNode[5] : 0.0})
                data.update({dataFormatNode[6] : 0.0})
                data.update({dataFormatNode[7] : 0.0})
                data.update({dataFormatNode[8] : 0.0})
                data.update({dataFormatNode[9] : 0.0})
                data.update({dataFormatNode[10] : nodes_values[0].status_value})
                data_out.update({'node_' + str(i) : data})

    elif map_opt == 'Map':
        data_time = Datafield.objects.using(database_to_use).latest('id')

        data_out = {}
        data = {}
        for i in range(len(dataFormatNode)):
            data.update({i : dataFormatNode[i]})
        data_out.update({'strings' : data})

        data_out.update({'nodes_length' : len(nodes_object)})

        for i in range(len(nodes_object)):

            nodes_values = list(Nodedata.objects.using(database_to_use).filter(address_value__id=nodes_object[i].id).filter(updatetime_value_id=data_time))

            if nodes_values and nodes_values[0].status_value=='successful':
                moist_min = nodes_object[i].node_moist_min
                moist_max = nodes_object[i].node_moist_max
                x_offset= nodes_object[i].node_x_offset
                y_offset= nodes_object[i].node_y_offset
                z_offset= nodes_object[i].node_z_offset

                data = {}
                acc_x = nodes_values[0].acc_x_value
                acc_y = nodes_values[0].acc_y_value
                acc_z = nodes_values[0].acc_z_value
                mag_x = nodes_values[0].mag_x_value
                mag_y = nodes_values[0].mag_y_value
                mag_z = nodes_values[0].mag_z_value

                corr_x =  acc_z
                corr_y = -acc_y
                corr_z = -acc_x

                force = np.sqrt(np.power(corr_x, 2) + np.power(corr_y, 2) + np.power(corr_z, 2))
                elev = 90 - np.arccos(corr_z/force) * 180.0/np.pi
                if x_offset==0:
                    azim=np.arctan2(corr_y, corr_x) * 180.0/np.pi
                else:
                    azim = np.arctan2((mag_y-y_offset),(mag_x-x_offset)) * 180.0/np.pi


                exec('func = lambda adc : ' + nodes_object[i].node_temp_function, locals(), globals())
                data.update({dataFormatNode[0] : func(nodes_values[0].temp_value)})
                data.update({dataFormatNode[1] : nodes_values[0].volt_value})
                data.update({dataFormatNode[2] : val2moist(nodes_values[0].moist_value, moist_min, moist_max)})
                data.update({dataFormatNode[3] : corr_z})
                data.update({dataFormatNode[4] : elev})
                data.update({dataFormatNode[5] : azim})
                data.update({dataFormatNode[6] : nodes_values[0].snr_value})
                data.update({dataFormatNode[7] : nodes_values[0].rssi_value})
                data.update({dataFormatNode[8] : nodes_values[0].fei_value})
                data.update({dataFormatNode[9] : nodes_values[0].flags_value})
                data.update({dataFormatNode[10] : nodes_values[0].status_value})
                data_out.update({'node_' + str(i) : data})
            else:
                data = {}
                data.update({dataFormatNode[0] : 0.0})
                data.update({dataFormatNode[1] : 0.0})
                data.update({dataFormatNode[2] : 0.0})
                data.update({dataFormatNode[3] : 0.0})
                data.update({dataFormatNode[4] : 0.0})
                data.update({dataFormatNode[5] : 0.0})
                data.update({dataFormatNode[6] : 0.0})
                data.update({dataFormatNode[7] : 0.0})
                data.update({dataFormatNode[8] : 0.0})
                data.update({dataFormatNode[9] : 0.0})
                data.update({dataFormatNode[10] : 'unsuccessful'})
                data_out.update({'node_' + str(i) : data})

        # Interpolate

        markerPos =  [
            [-33.647548, -70.345183],
            [-33.646016, -70.344042],
            [-33.647011, -70.343383],
            [-33.646386, -70.345689],
            [-33.645941, -70.344665]
        ];

        markers_n = len(markerPos)

        tmp_markerPos = [list(x) for x in zip(*markerPos)]

        x_pos = [min(tmp_markerPos[0]), max(tmp_markerPos[0])]
        y_pos = [min(tmp_markerPos[1]), max(tmp_markerPos[1])]

        new_size_x = 30
        new_size_y = 30

        x_y = []
        z = []

        if interp_opt == "MoistureNode":
            for i in range(markers_n):
                z.append(data_out['node_' + str(i)]['MoistureNode'])

        elif interp_opt == "SNRNode":
            for i in range(markers_n):
                z.append(data_out['node_' + str(i)]['SNRNode'])

        elif interp_opt == "RSSINode":
            for i in range(markers_n):
                z.append(data_out['node_' + str(i)]['RSSINode'])

        elif interp_opt == "FEINode":
            for i in range(markers_n):
                z.append(data_out['node_' + str(i)]['FEINode'])
        else:
            for i in range(markers_n):
                z.append(data_out['node_' + str(i)]['TemperatureNode'])

        xnew, ynew = np.mgrid[x_pos[1]:x_pos[0]:new_size_x*1j, y_pos[0]:y_pos[1]:new_size_y*1j]
        znew = griddata(markerPos, z, (xnew, ynew), method='linear')

        where_are_NaNs = np.isnan(znew)
        znew[where_are_NaNs] = 0

        if interp_opt == "MoistureNode":
            znew = np.clip(znew , 0.0, 100.0)

        data_output = {}

        for i in range(new_size_x):
            for j in range(new_size_y):
                data_output.update({'z_' + str(i*new_size_y + j):znew[i][j]})

        data_out.update({'map_data' : data_output})

    elif map_opt == 'Serie':

        data_out = {}
        data = {}

        data_time =  Datafield.objects.using(database_to_use).latest('id')

        for i in range(len(dataFormatNode)):
            data.update({i : dataFormatNode[i]})
        data_out.update({'strings' : data})

        data_out.update({'nodes_length' : len(nodes_object)})

        for i in range(len(nodes_object)):

            nodes_values = list(Nodedata.objects.using(database_to_use).filter(address_value__id=nodes_object[i].id).filter(updatetime_value_id=data_time))

            if nodes_values and nodes_values[0].status_value=='successful':
                moist_min = nodes_object[i].node_moist_min
                moist_max = nodes_object[i].node_moist_max
                x_offset= nodes_object[i].node_x_offset
                y_offset= nodes_object[i].node_y_offset
                z_offset= nodes_object[i].node_z_offset

                data = {}
                acc_x = nodes_values[0].acc_x_value
                acc_y = nodes_values[0].acc_y_value
                acc_z = nodes_values[0].acc_z_value
                mag_x = nodes_values[0].mag_x_value
                mag_y = nodes_values[0].mag_y_value
                mag_z = nodes_values[0].mag_z_value

                corr_x =  acc_z
                corr_y = -acc_y
                corr_z = -acc_x

                force = np.sqrt(np.power(corr_x, 2) + np.power(corr_y, 2) + np.power(corr_z, 2))
                elev = 90 - np.arccos(corr_z/force) * 180.0/np.pi
                if x_offset==0:
                    azim=np.arctan2(corr_y, corr_x) * 180.0/np.pi
                else:
                    azim = np.arctan2((mag_y-y_offset),(mag_x-x_offset)) * 180.0/np.pi


                exec('func = lambda adc : ' + nodes_object[i].node_temp_function, locals(), globals())

                data.update({dataFormatNode[0] : func(nodes_values[0].temp_value)})
                data.update({dataFormatNode[1] : nodes_values[0].volt_value})
                data.update({dataFormatNode[2] : val2moist(nodes_values[0].moist_value, moist_min, moist_max)})
                data.update({dataFormatNode[3] : corr_z})
                data.update({dataFormatNode[4] : elev})
                data.update({dataFormatNode[5] : azim})
                data.update({dataFormatNode[6] : nodes_values[0].snr_value})
                data.update({dataFormatNode[7] : nodes_values[0].rssi_value})
                data.update({dataFormatNode[8] : nodes_values[0].fei_value})
                data.update({dataFormatNode[9] : nodes_values[0].flags_value})
                data.update({dataFormatNode[10] : 1.0})
                data_out.update({'node_' + str(i) : data})
            else:
                data = {}
                data.update({dataFormatNode[0] : 0.0})
                data.update({dataFormatNode[1] : 0.0})
                data.update({dataFormatNode[2] : 0.0})
                data.update({dataFormatNode[3] : 0.0})
                data.update({dataFormatNode[4] : 0.0})
                data.update({dataFormatNode[5] : 0.0})
                data.update({dataFormatNode[6] : 0.0})
                data.update({dataFormatNode[7] : 0.0})
                data.update({dataFormatNode[8] : 0.0})
                data.update({dataFormatNode[9] : 0.0})
                data.update({dataFormatNode[10] : 0.0})
                data_out.update({'node_' + str(i) : data})

        if interp_opt == 'MoistureNode':
            nodes_values = np.array(Nodedata.objects.using(database_to_use).values_list('datatime', dataFormatBase[interp_opt], 'temp_value','status_value').filter(address_value__node_display=True).filter(updatetime_value__update_time__gte=begin_date, updatetime_value__update_time__lte=finish_date, address_value__id=nodes_object[int(node_opt)].id).order_by('datatime'))
        elif interp_opt == 'AccelerationNode' or interp_opt == 'ElevationNode' or interp_opt == 'AzimuthNode':
            nodes_values = np.array(Nodedata.objects.using(database_to_use).values_list('datatime', 'acc_x_value', 'acc_y_value', 'acc_z_value','mag_x_value','mag_y_value','mag_z_value').filter(address_value__node_display=True).filter(updatetime_value__update_time__gte=begin_date, updatetime_value__update_time__lte=finish_date, address_value__id=nodes_object[int(node_opt)].id).order_by('datatime'))
        else:
            nodes_values = np.array(Nodedata.objects.using(database_to_use).values_list('datatime', dataFormatBase[interp_opt],'status_value').filter(address_value__node_display=True).filter(updatetime_value__update_time__gte=begin_date, updatetime_value__update_time__lte=finish_date, address_value__id=nodes_object[int(node_opt)].id).order_by('datatime'))

        data = []
        MEDIAN_SIZE = 21
        moist_min = nodes_object[int(node_opt)].node_moist_min
        moist_max = nodes_object[int(node_opt)].node_moist_max
        tmp_function = nodes_object[int(node_opt)].node_temp_function
        x_offset= nodes_object[int(node_opt)].node_x_offset
        y_offset= nodes_object[int(node_opt)].node_y_offset
        z_offset= nodes_object[int(node_opt)].node_z_offset

        if interp_opt == 'AccelerationNode' or interp_opt == 'ElevationNode' or interp_opt == 'AzimuthNode':
            nodes_values[:,1] = signal.medfilt(nodes_values[:, 1], MEDIAN_SIZE)
            nodes_values[:,2] = signal.medfilt(nodes_values[:, 2], MEDIAN_SIZE)
            nodes_values[:,3] = signal.medfilt(nodes_values[:, 3], MEDIAN_SIZE)
            nodes_values[:,4] = signal.medfilt(nodes_values[:, 4], MEDIAN_SIZE)
            nodes_values[:,5] = signal.medfilt(nodes_values[:, 5], MEDIAN_SIZE)
            nodes_values[:,6] = signal.medfilt(nodes_values[:, 6], MEDIAN_SIZE)
            acc_x = nodes_values[:, 1]
            acc_y = nodes_values[:, 2]
            acc_z = nodes_values[:, 3]
            mag_x = nodes_values[:, 4]
            mag_y = nodes_values[:, 5]
            mag_z = nodes_values[:, 6]

            corr_x = np.array( acc_z, dtype=np.float64)
            corr_y = np.array(-acc_y, dtype=np.float64)
            corr_z = np.array(-acc_x, dtype=np.float64)
            if interp_opt == 'AccelerationNode':
                save_value = corr_z
            elif interp_opt == 'ElevationNode':
                save_value = 90 - np.arccos(corr_z/(np.sqrt(np.power(corr_x, 2) + np.power(corr_y, 2) + np.power(corr_z, 2)))) * 180.0/np.pi
            elif interp_opt == 'AzimuthNode':
                if x_offset==0:
                    save_value = np.arctan2(corr_y, corr_x) * 180.0/np.pi
                else:
                    save_value= np.arctan2((mag_y-y_offset),(mag_x-x_offset)) * 180.0/np.pi
            for i in range(len(nodes_values[:, 0])):
                data.append({
                    'date' : nodes_values[i, 0],
                    'value' : save_value[i]
                })
        elif interp_opt == 'MoistureNode':
            nodes_values[:,1] = signal.medfilt(nodes_values[:, 1], MEDIAN_SIZE)
            nodes_values[:,2] = signal.medfilt(nodes_values[:, 2], MEDIAN_SIZE)
            save_value = np.array(nodes_values[:, 1], dtype=np.float64)
            tmp_value = np.array(nodes_values[:, 2], dtype=np.float64)
            status= np.array(signal.medfilt(nodes_values[:, 3], MEDIAN_SIZE))
            if volt_opt == 'false':
                exec('func = lambda adc : ' + tmp_function, locals(), globals())
                tmp_value = func(tmp_value)
                save_value = moist2cal(save_value, tmp_value)
                save_value = val2moist(save_value, moist_min, moist_max)
            for i in range(len(nodes_values[:, 0])):
                if status[i]=='successful':
                    data.append({
                        'date' : nodes_values[i, 0],
                        'value' : save_value[i]
                    })
        elif interp_opt == 'TemperatureNode':
            nodes_values[:,1] = signal.medfilt(nodes_values[:, 1], MEDIAN_SIZE)
            save_value = np.array(nodes_values[:,1], dtype=np.float64)
            status= np.array(nodes_values[:, 2])
            if volt_opt == 'false':
                exec('func = lambda adc : ' + tmp_function, locals(), globals())
                save_value = func(save_value)
            for i in range(len(nodes_values[:, 0])):
                if status[i]=='successful':


                    data.append({
                        'date' : nodes_values[i, 0],
                        'value' : save_value[i]
                    })
        elif interp_opt == 'StatusNode':
            status= np.array(nodes_values[:, 1])
            for i in range(len(nodes_values[:, 0])):
                if status[i]=='successful':
                    status[i]=1;
                else:
                    status[i]=0;
            for i in range(len(nodes_values[:, 0])):
                data.append({
                    'date' : nodes_values[i, 0],
                    'value' : status[i]
                })


        else:
            save_value = signal.medfilt(nodes_values[:, 1], MEDIAN_SIZE)
            for i in range(len(nodes_values[:, 0])):
                data.append({
                    'date' : nodes_values[i, 0],
                    'value' : save_value[i]
                })
        data_out.update({'time_data' : data})

    return JsonResponse(data_out, safe=False)

def csv_query(request):

    place_query = request.path.split('/')[1]
    database_to_use = place_query
    interp_opt = request.GET['interp']
    map_opt = request.GET['map']
    node_opt = request.GET['node_n']
    volt_opt = request.GET['volt_disp']

    begin_date = request.GET['init_date']
    finish_date = request.GET['finish_date']

    begin_date = timezone.make_aware(timezone.datetime.strptime(begin_date, "%d/%m/%Y"))
    finish_date = timezone.make_aware(timezone.datetime.strptime(finish_date, "%d/%m/%Y")+timezone.timedelta(days=1))

    df = Datafield.objects.using(database_to_use).filter(update_time__gte=begin_date, update_time__lte = finish_date).order_by('id')
    df_len = len(df)

    if df_len == 0:
        df_0 = Datafield.objects.using(database_to_use).latest('id')
        df_dt = df_0.update_time

        begin_date = df_dt.replace(hour=0, minute=0, second=0, microsecond=0)-timezone.timedelta(days=1)
        finish_date = df_dt.replace(hour=0, minute=0, second=0, microsecond=0)

        df = Datafield.objects.using(database_to_use).filter(update_time__gte=begin_date, update_time__lte = finish_date).order_by('id')

    df_len = len(df)

    begin_n = df[0].id
    end_n = df[df_len-1].id

    nodes_object = Nodeaddress.objects.using(database_to_use).exclude(node_address=0).filter(node_display=True)

    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename=' + 'Nodo-' + node_opt + '_Dato-' + interp_opt.split('Node')[0] + '_FechaInicio-' + begin_date.strftime("%d-%b-%Y") + '_FechaFin-' + finish_date.strftime("%d-%b-%Y") + '.csv'
    writer = csv.writer(response)
    writer.writerow(['Time', interp_opt.split('Node')[0] + ' [' + dataFormatUnit[interp_opt] + ']'])

    if interp_opt == 'MoistureNode':
        nodes_values = np.array(Nodedata.objects.using(database_to_use).values_list('datatime', dataFormatBase[interp_opt], 'temp_value').filter(address_value__node_display=True).filter(updatetime_value__update_time__gte=begin_date, updatetime_value__update_time__lte=finish_date, address_value__id=nodes_object[int(node_opt)].id).order_by('datatime'))
    elif interp_opt == 'AccelerationNode' or interp_opt == 'ElevationNode' or interp_opt == 'AzimuthNode':
        nodes_values = np.array(Nodedata.objects.using(database_to_use).values_list('datatime', 'acc_x_value', 'acc_y_value', 'acc_z_value').filter(address_value__node_display=True).filter(updatetime_value__update_time__gte=begin_date, updatetime_value__update_time__lte=finish_date, address_value__id=nodes_object[int(node_opt)].id).order_by('datatime'))
    else:
        nodes_values = np.array(Nodedata.objects.using(database_to_use).values_list('datatime', dataFormatBase[interp_opt]).filter(address_value__node_display=True).filter(updatetime_value__update_time__gte=begin_date, updatetime_value__update_time__lte=finish_date, address_value__id=nodes_object[int(node_opt)].id).order_by('datatime'))

    data = []
    moist_min = nodes_object[int(node_opt)].node_moist_min
    moist_max = nodes_object[int(node_opt)].node_moist_max
    tmp_function = nodes_object[int(node_opt)].node_temp_function
    if interp_opt == 'AccelerationNode' or interp_opt == 'ElevationNode' or interp_opt == 'AzimuthNode':
        acc_x = nodes_values[:, 1]
        acc_y = nodes_values[:, 2]
        acc_z = nodes_values[:, 3]

        corr_x = np.array( acc_z, dtype=np.float64)
        corr_y = np.array(-acc_y, dtype=np.float64)
        corr_z = np.array(-acc_x, dtype=np.float64)
        if interp_opt == 'AccelerationNode':
            save_value = corr_z
        elif interp_opt == 'ElevationNode':
            save_value = 90 - np.arccos(corr_z/(np.sqrt(np.power(corr_x, 2) + np.power(corr_y, 2) + np.power(corr_z, 2)))) * 180.0/np.pi
        elif interp_opt == 'AzimuthNode':
            save_value = np.arctan2(corr_y, corr_x) * 180.0/np.pi
        for i in range(len(nodes_values[:, 0])):
            writer.writerow([
                nodes_values[i, 0],
                save_value[i]
            ])
    elif interp_opt == 'MoistureNode':
        save_value = np.array(nodes_values[:, 1], dtype=np.float64)
        tmp_value = np.array(nodes_values[:, 2], dtype=np.float64)
        if volt_opt == 'false':
            exec('func = lambda adc : ' + tmp_function, locals(), globals())
            tmp_value = func(tmp_value)
            save_value = moist2cal(save_value, tmp_value)
            save_value = val2moist(save_value, moist_min, moist_max)
        for i in range(len(nodes_values[:, 0])):
            writer.writerow([
                nodes_values[i, 0],
                save_value[i]
            ])
    elif interp_opt == 'TemperatureNode':
        save_value = np.array(nodes_values[:,1], dtype=np.float64)
        if volt_opt == 'false':
            exec('func = lambda adc : ' + tmp_function, locals(), globals())
            save_value = func(save_value)
        for i in range(len(nodes_values[:, 0])):
            writer.writerow([
                nodes_values[i, 0],
                save_value[i]
            ])
    else:
        save_value = nodes_values[:, 1]
        for i in range(len(nodes_values[:, 0])):
            writer.writerow([
                nodes_values[i, 0],
                save_value[i]
            ])
    return response
