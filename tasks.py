from celery import Celery
from flask import current_app
from boto.s3.connection import S3Connection
from boto.s3.key import Key
import os
celery = Celery('tasks', broker=current_app.config.get('BROKER_URL'))


@celery.task
def save_image_to_s3(filename):
    with open(os.path.join('/static/temp/' ,filename), 'r') as img:
        conn = S3Connection(current_app.config['AWS_ACCESS_KEY'], current_app.config['AWS_SECRET_KEY'])
        b = conn.create_bucket(current_app.config.get('AWS_BUCKET_NAME'))
        k = Key(b)
        k.set_contents_from_file(img)
    return k.key






#
#
#
#
#
# def save_image(image_object):
#     conn = S3Connection(app.config['AWS_ACCESS_KEY'], app.config['AWS_SECRET_KEY'])
#     b = conn.create_bucket(app.config["AWS_BUCET"])
#     k = Key(b)
#     k.set_contents_from_file(image_object.read())
#     return k.key
#

