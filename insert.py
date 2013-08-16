"""
    Command line arguments take the form:
        python insert.py json_path region_name trailname_key1 trailname_key2 etc..

"""
from models import Segment
from flask import Flask
from elevations import ElevationPath
from flask.ext.mongoengine import MongoEngine
from mongoengine import errors
import sys
# from pymongo import MongoClient
import json
from geo import Path

def insert_collection(json_file, region, name_keys):
    results = []
    err = []
    with open(json_file) as j_file:
        j = json.load(j_file)
        if 'type' in j and j['type'] == 'FeatureCollection':
            feature_list = j['features']
            for feat in feature_list:
                print "Has geometry? " + str(feat.get('geometry') is not None)
                names = [feat.get('properties').get(key).title() for key in name_keys if feat.get('properties').get(key)]
                print names
                if feat and feat.get('geometry'):
                    path = Path(**feat)
                    s = Segment(coordinates = path.geo_json, trail_names = names,
                                length = len(path), region = region)
                    try:
                        s.save()
                        results.append(s)
                    except (errors.OperationError, errors.ValidationError):
                        err.append(s)
                        continue
    return results, err



if __name__ == "__main__":
    app = Flask(__name__)
    app.config.from_object('settings')
    db = MongoEngine(app)
    path = sys.argv[1]
    region = sys.argv[2]
    name_keys = sys.argv[3:]
    results, err = insert_collection(path, region, name_keys)
    print "%s documents inserted in to collection %s." % (len(results), Segment.__name__.lower())
    print "Errors:"
    print "\n".join(str(s.__dict__) for s in err)
