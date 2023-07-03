import smtplib
import email.message
import email.utils
import pymysql
import os
import boto3
import datetime
import time
import pytz
from tzlocal import get_localzone
from dateutil.parser import parse

tz = get_localzone()
ssm = boto3.client('ssm', region_name=os.environ['REGION'])
DB_NAME = os.environ['DB_NAME']
DB_USER = os.environ['DB_USER']
DB_PASSWORD = os.environ['DB_PASSWORD']
DB_HOSTNAME = os.environ['DB_HOSTNAME']
DB_PORT = os.environ['DB_PORT']
DB_PLACES = os.environ['DB_PLACES']

def send_email(send_from, send_to, place, time_date, time_now):

    msg = email.message.Message()
    msg['From'] = send_from
    msg['To'] = send_to
    msg['Subject'] = "[" + place + "] Hasn't updated since " + time_date.astimezone(tz).strftime("%d/%m/%Y %H:%M:%S")
    msg.add_header('Content-Type', 'text')
    msg.set_payload("Check state of the Gateway in " + place + "\n" + time_now.astimezone(tz).strftime("%d/%m/%Y %H:%M:%S"))

    smtp_obj = smtplib.SMTP_SSL("smtp.gmail.com", 465)
    smtp_obj.ehlo()
    smtp_obj.login("mwlnotifications@gmail.com", "tpr123$#")
    smtp_obj.sendmail(msg['From'], [msg['To']], msg.as_string())
    smtp_obj.quit()

while True:

    now_t = datetime.datetime.now(pytz.utc)
    db_places_to_check = []
    db_places_emails = {}
    db_places_dead = {}
    state = {}

    db_conn_places = pymysql.connect(
        host       =     DB_HOSTNAME,
        user       =     DB_USER,
        password   =     DB_PASSWORD,
        db         =     DB_PLACES,
        port       = int(DB_PORT)
    )

    cur_places = db_conn_places.cursor()

    cur_places.execute('SELECT * FROM ' + DB_PLACES + ';')

    for row in cur_places:
        db_places_to_check.append(row[1])
        db_places_emails.update({row[1] : row[3]})
        db_places_dead.update({row[1] : row[4]})
        state.update({row[1] : row[2]})

    for i in db_places_to_check:
        db_conn = pymysql.connect(
            host       =     DB_HOSTNAME,
            user       =     DB_USER,
            password   =     DB_PASSWORD,
            db         =     i,
            port       = int(DB_PORT)
        )

        cur = db_conn.cursor()

        emails = db_places_emails[i].split(",")

        cur.execute('SELECT * FROM processing_datafield WHERE id = (SELECT MAX(id) FROM processing_datafield)')
        for row in cur:
            diff = now_t-row[1].replace(tzinfo = pytz.utc)
            if state[i] == 1:
                if abs(diff) > datetime.timedelta(hours=int(db_places_dead[i])):
                    print("Sending emails for: " + i)
                    for j in emails:
                        send_email("mwlnotifications@gmail.com", j, i, row[1].replace(tzinfo =  pytz.utc), now_t)
                    state[i] = 0
            else:
                if abs(diff) <= datetime.timedelta(hours=int(db_places_dead[i])):
                    print("Recovering from not updating")
                    state[i] = 1
        cur.close()

        cur_places.execute('UPDATE ' + DB_PLACES + ' set connected = ' + str(state[i]) + ' where place_name = "' + i + '";')
        db_conn_places.commit()
    cur_places.close()
    db_conn_places.close()

    time.sleep(20)