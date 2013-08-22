"""
Options:
  -h, --help            show this help message and exit
  -f FILE, --file=FILE  Path to geodata file.
  -r str, --replace=str
                        Searches trail names for the first name and replaces
                        it with the second name
  --region=REGION       A region name to use for all segments.
  -s SPLIT, --split=SPLIT
                        Replaces NAME with a sequence of two names.
"""
from optparse import OptionParser
from models import Segment
from flask import Flask
from flask.ext.mongoengine import MongoEngine
from mongoengine import errors
import json
from geo import Path

def insert_collection(json_file, region, name_keys, replacement, split):
    results = []
    err = []
    with open(json_file) as j_file:
        j = json.load(j_file)
        if 'type' in j and j['type'] == 'FeatureCollection':
            feature_list = j['features']
            for feat in feature_list:
                print "Has geometry? " + str(feat.get('geometry') is not None)
                names = []
                for key in name_keys:
                    n = feat.get('properties').get(key)
                    print n
                    if replacement and n in replacement: names.append(replacement[n])
                    elif split and n in split: names += list(split[n])
                    elif n: names.append(n.title())
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
    parser = OptionParser()
    parser.add_option("-f", "--file", dest="filename",
                  help="Path to geodata file.", metavar="FILE")
    parser.add_option("-r", "--replace", nargs = 2, dest="replace", action="append",
                  help="Searches trail names for the first name and replaces it with the second name")
    parser.add_option("--region", dest = "region", help="A region name to use for all segments.")
    parser.add_option("-s", "--split", dest = "split", nargs=3, help = "Replaces NAME with a sequence of two names.")
    (options, args) = parser.parse_args()
    split = {options.split[0]: options.split[1:]} if options.split else None
    replace = dict(options.replace) if options.replace else None
    app = Flask(__name__)
    # app.config.from_object('local_settings')
    app.config.from_object('settings')
    db = MongoEngine(app)
    results, err = insert_collection(options.filename, options.region, args, replace, split)
    print "%s documents inserted in to collection %s." % (len(results), Segment.__name__.lower())
    print "Errors:"
    print "\n".join(str(s.__dict__) for s in err)
