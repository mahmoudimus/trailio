from flask import Flask, request, session, redirect, url_for, render_template, jsonify, abort
from flask.ext.mongoengine import MongoEngine
from flask_oauth import OAuth
from models import *
import sys
from images import s3_save_image
import os
from geo import Box, Point

application = Flask(__name__)
application.config.from_object('settings')
if os.environ.get('TRAILIO_SETTINGS'):
    application.config.from_envvar('TRAILIO_SETTINGS')

db = MongoEngine(application)
oauth = OAuth()
application.secret_key = application.config.get('APP_SECRET')
facebook = oauth.remote_app('facebook',
    base_url='https://graph.facebook.com/',
    request_token_url = None,
    access_token_url = '/oauth/access_token',
    authorize_url = 'https://www.facebook.com/dialog/oauth',#invokes login dialog
    consumer_key = application.config.get('FACEBOOK_APP_ID'),
    consumer_secret = application.config.get('FACEBOOK_APP_SECRET'),
    request_token_params = {'scope': 'email'}
)

def segment_collection_response(obj_list):

    return jsonify({
        'type' : 'FeatureCollection',
        'features' : [{

            'type': 'Feature',
            'properties' : {
                'id' : str(obj.id),
                'trail_names': obj.trail_names,
                'length' : obj.length,
                'region': obj.region
            },
        'geometry' : obj.coordinates
        } for obj in obj_list]
    })


@facebook.tokengetter
def token_getter(token=None):
    return session.get('facebook_token')

@application.route('/login')
def login():
    # todo: clean up redirect
    return facebook.authorize(
        callback=url_for('oauth_authorized', redirect_url = '/', _external=True)
    )

@application.route('/oauth-authorized')
@facebook.authorized_handler
def oauth_authorized(resp):
    next_url = request.args.get('redirect_url')
    if resp is not None or 'uid' not in session:
        application.logger.debug(resp)
        session['facebook_token'] = (
            resp['access_token'],
            ''
        )
        user = facebook.get('https://graph.facebook.com/me', {'fields' : 'id,first_name,last_name,link,picture'}).data
        session['uid'] = user.get('id')
        User.objects.get_or_create(uid = user.get('id'), first_name = user.get('first_name'), last_name = user.get('last_name'),
                    profile_url = user.get('link'), picture = user.get('picture')['data']['url'])
    return redirect(next_url)



@application.route('/api/segments/bounds', methods=['GET'])
def bbox_query():
    box = Box(west =float(request.args.get('west')),
                south = float(request.args.get('south')),
                east = float(request.args.get('east')),
                north = float(request.args.get('north')))
    results = Segment.bbox_query(box)
    return segment_collection_response(results)

@application.route('/api/segments/trail_name/<name>', methods = ["GET"])
def trail_names_query(name):
    results = Segment.objects(trail_names=' '.join(name.split('_')))
    return segment_collection_response(results)

@application.route('/api/named_route/<name>', methods = ['GET', 'POST'])
def named_route_model(name):
    if request.method == 'POST':
        segids = request.form['segs'].split('+')
        route = NamedRoute.create_named_route_document(segids, name)
        if route:
            return jsonify(route.json)
    elif request.method == 'GET':
        route = NamedRoute.objects(name = ' '.join(name.split('_'))).first()
        if route:
            return jsonify(route.json)
    return jsonify({})

@application.route('/api/route/', methods = ['POST'])
def get_anon_route():
    sids = sorted(request.values['selected'].split('+'))
    route = AnonRoute.get_or_create_anon_route(sids)
    return jsonify({'path': route.path})


@application.route('/api/named_route/', methods = ['GET'])
def named_route_collection():
    search = request.args.get('search')
    if search is not None:
        return jsonify({
            'type' : 'FeatureCollection',
            'features' : [r.json for r in NamedRoute.search_classic_routes(search)]
        })
    length, page = request.args.get('length', 10), request.args.get('page', 1)
    return jsonify({
        'type' : 'FeatureCollection',
        'features' : [r.json for r in NamedRoute.get_classic_routes(limit = length, page= page)]
    })

# @application.route('/api/route/', methods = ['GET', 'POST'])
# def anon_route_model():
#     sids = sorted(request.values['selected'].split('+'))
#     route = AnonRoute.get_or_create_anon_route(sids)
#     return jsonify(route.json)

@application.route('/api/photo/', methods = ['GET', 'POST'])
def image():
    error = {'result' : None}
    if request.method == 'POST':
        if 'uid' in session: #if user
            img = request.files.get('files[]')
            coords = request.values.get('coords').split(',')
            text = request.values.get('text')
            if coords and text:
                key = s3_save_image(img)
                path = request.values['path'].split('/')
                if path[0] == 'named_route':
                    r = NamedRoute.objects(name = ' '.join(path[1].split('_'))).get()
                else:
                    r = AnonRoute.objects(key = path[1]).get()
                p = Point(float(coords[0]), float(coords[1]))
                # user = User.objects(uid = session['uid'])
                seg = Segment.objects(coordinates__near=p.geo_json).first()
                photo = Photo(s3_key = key, location = p.geo_json, text = text, route = r, segment = seg, user = session['uid'])
                photo.save()
                return jsonify(photo.json)
            else:
                error['result'] = "Your photo must have GPS coordinates to post to a route."
        else:
            error['result'] = "You must be logged in to post a photo."
    return jsonify(error)


# def upload_file():
#     if request.method == 'POST':
#         file = request.files['file']
#         if file and allowed_file(file.filename):
#             upload_to_s3(file)  # or however it's done
#             return ... #successful upload
#     return ..

@application.route('/api/vote/route/<rid>', methods = ['POST'])
def vote_route(rid):
    if 'uid' in session:
        uid = session['uid']
        v = Vote.get_or_set_vote(uid, rid)
        if v:
            NamedRoute.vote(rid)
            return jsonify({'result' : True})
        else: abort(403)
    else: abort(401)

@application.route('/api/vote/photo/<pid>', methods = ['POST'])
def vote_photo(pid):
    if 'uid' in session:
        v = Vote.get_or_set_vote(session['uid'], pid)
        if v:
            Photo.vote(pid)
            return jsonify({'result' : True})
        else: abort(403)
    else: abort(401)

@application.route('/api/user/<routeid>', methods = ['POST', 'GET'])
def user_route(routeid):
    if request.method == 'POST':
        if 'uid' in session:
            r = Route.objects(id = routeid)
            v = Vote.get_or_set_vote(session['uid'], routeid)
            response = facebook.post('https://graph.facebook.com/me/trailio:go_on', {"object" : url_for(r.path, _external = True)})
            ur = UserRoute(user = session['uid'], route =r, graph_id = response.get('data').get('id'))
            return jsonify({})
        else: abort(401)

@application.route('/editor', methods = ['GET'])
def route_editor():
    return render_template('editor.html')


@application.route('/named_route/<name>', methods = ['GET'])
def named_route_page(name):
    ctx = {'user' : None}
    if 'uid' in session:
        user = User.objects(uid=session['uid']).get()
        ctx['user'] = user.json
    route = NamedRoute.objects(name=' '.join(name.split('_'))).first()
    ctx.update(route.json)
    return render_template('route.html', **ctx)

@application.route('/route/<rid>', methods = ['GET'])
def anon_route_page(rid):
    ctx = {'user' : None}
    if 'uid' in session:
        user = User.objects(uid=session['uid']).get()
        ctx['user'] = user.json
    route = AnonRoute.objects(id = rid).first()
    # application.logger.debug(route.json)
    ctx.update(route.json)
    return render_template('route.html', **ctx)

@application.route('/profile/<uid>', methods = ['GET'])
def get_profile(uid):
    ctx = {'user': None}
    if 'uid' in session:
        user = User.objects(uid = session['uid']).get()
        ctx['user'] = user.json
    profile = User.objects(uid = uid).get()
    ctx.update(profile.profile)
    return render_template('profile.html', **ctx)

@application.route('/', methods=['GET'])
def front():
    ctx = {
        'classic_routes' : [r.json for r in NamedRoute.get_classic_routes()],
        'recent_photos' : [p.json for p in Photo.recent_photos()],
        'user' : None
    }
    if 'uid' in session:
        user = User.objects(uid = int(session['uid'])).get()
        ctx['user'] = user.json
    return render_template('front.html', **ctx)

if __name__ == '__main__':
    port = int(sys.argv[1])
    application.run(debug=True, host="0.0.0.0", port=port)
    application.config.from_object('local_settings')
