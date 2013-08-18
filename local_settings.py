__author__ = 'peterfrance'


DEBUG = True

AWS_ACCESS_KEY = 'AKIAJXIGQPLBBZFPTEHQ'
AWS_SECRET_KEY = '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'
AWS_BUCKET_NAME = 'trail-io-images'

MONGODB_SETTINGS = {
    'DB' : 'trailio'
}

FACEBOOK_APP_ID = '124265567722564'
FACEBOOK_APP_SECRET = '49acc7371b926066d02ce4928a873ed7'
APP_SECRET = '17f51e87711c9c16d86105174044e817'


# BROKER_URL = 'redis://localhost:6379/0'
BROKER_TRANSPORT_OPTIONS = {'visibility_timeout': 3600}
UPLOAD_FOLDER = 'static/temp'
S3_BUCKET_LINK = 'https://s3.amazonaws.com/trail-io-images/'