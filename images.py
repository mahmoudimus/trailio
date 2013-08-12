from flask import current_app
from datetime import datetime
from boto.s3.connection import S3Connection
from boto.s3.key import Key
from hashlib import md5
import mimetypes
from PIL import Image
import os

ALLOWED_EXTENSIONS = ['txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif']
TEMP_PATH = "static/temp/"
SIZES = {'small': (75,75), 'medium' : (700,400)}

# def upload_file():
#     if request.method == 'POST':
#         file = request.files['file']
#         if file and allowed_file(file.filename):
#             filename = secure_filename(file.filename)
#             conn = S3Connection('credentials', '')
#
#
#              = 'foobar'
#             k.set_contents_from_string(file.readlines())
#             return "Success!"



def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS



def create_sized_image(bucket, base_key, ext, size=None):
    if size:
        keyname = base_key + str(size[0]) + 'x'+ str(size[1])
        path = TEMP_PATH + keyname
        img = Image.open(TEMP_PATH + base_key)
        img.thumbnail(size, Image.ANTIALIAS)
        img.save(path, 'JPEG')
    else:
        path = TEMP_PATH + base_key
        keyname = base_key
    mimetypes.init()
    k = Key(bucket)
    k.key = keyname
    k.set_metadata('Content-Type', mimetypes.types_map[ext])
    k.set_contents_from_filename(path)
    return path


def s3_save_image(image_object):

    if image_object:
        ext = '.' + image_object.filename.split('.')[-1].lower()
        m = md5()
        m.update(str(datetime.now()))
        keyname = m.hexdigest()
        conn = S3Connection(current_app.config.get('AWS_ACCESS_KEY'), current_app.config.get('AWS_SECRET_KEY'))
        bucket = conn.create_bucket(current_app.config.get('AWS_BUCKET_NAME'))
        image_object.save(TEMP_PATH + keyname)
        base_path = create_sized_image(bucket, keyname, ext)
        for size in SIZES.values():
            path = create_sized_image(bucket, keyname, ext, size)
            os.remove(path)
        os.remove(base_path)
        return keyname
    return None


    # k = Key(b)
    # k.set_contents_from_file(image_object.read())
    # return k.key


