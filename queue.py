__author__ = 'peterfrance'

from boto.sqs.connection import SQSConnection
conn = SQSConnection('<aws access key>', '<aws secret key>')

q = conn.create_queue('myqueue')

from boto.sqs.message import Message

class ImageUpload(Message):
    pass


q.set_message_class(ImageUpload)

def queue_image_upload(img_object)
