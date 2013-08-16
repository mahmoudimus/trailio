__author__ = 'peterfrance'

from models import Segment
from flask import Flask
from flask.ext.mongoengine import MongoEngine
from mongoengine import errors
import sys
import json
from geo import Path

# loc.objects(poly__geo_intersects={"type": "Point", "coordinates": [40, 6]})

def break_segment(oid):
    seg_model = Segment.objects(id=oid).get()
    seg = Path(**seg_model.coordinates)
    points = []
    for s in Segment.objects(coordinates__geo_intersects = seg_model.coordinates):
        p = Path(**s.coordinates)
        if p[0] in seg: points.append(p[0])
        elif p[-1] in seg: points.append(p[-1])
    new_models = []
    start = 0
    for i, point in enumerate(seg):
        if i == 0: continue
        if point in points or i == len(seg.list) - 1:
            new_p = seg.slice(start, i+1)
            new_m = Segment(coordinates= new_p.geo_json, trail_names=seg_model.trail_names, length = len(new_p),
                                    region = seg_model.region)
            new_models.append(new_m)
            new_m.save()
            start  = i
    seg_model.delete()
    return new_models

if __name__ == "__main__":
    app = Flask(__name__)
    # app.config.from_object('local_settings')
    app.config.from_object('settings')
    db = MongoEngine(app)
    oid = sys.argv[1]
    print oid
    results = break_segment(oid)
    print "Segment broken in to %s sections" % len(results)
