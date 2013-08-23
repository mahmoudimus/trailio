from mongoengine import *
from datetime import datetime
from hashlib import md5
from geo import make_ordered_path
from flask import current_app
from elevations import ElevationPath
from images import SIZES
from flask import session
from flask.ext.admin import BaseView, expose
from flask.ext.admin.contrib.mongoengine import ModelView
# from flask.ext.login import current_user

DEFAULT_ROUTE_PHOTO = 'static/images/75x75.gif'

class Segment(Document):
    trail_names = ListField(StringField(), default=list)
    date = DateTimeField(default = datetime.now)
    coordinates = LineStringField()
    length = FloatField()
    region = StringField()

    @classmethod
    def bbox_query(cls, box):
        return cls.objects(coordinates__geo_intersects = box.geo_json())

class Pages(Document):
    date = DateTimeField(default = datetime.now)
    title = StringField()
    text = StringField()

class Section(Document):
    coordinates = LineStringField()
    elevations = ListField(FloatField(), default = list)
    width = IntField()
    index = IntField()

class Route(Document):
    id = StringField(primary_key=True)
    coordinates = LineStringField()
    votesum = IntField(default = 0)
    regions = ListField(StringField())
    info = StringField()
    distance = IntField()
    elevation_gain = DictField()
    elevations = ListField(IntField(), default = list)
    meta = {'allow_inheritance': True,
            'indexes' : ['-votesum']
            }

    def photos(self, limit = 10):
        return Photo.objects(route=self)[:10]

    @property
    def photo(self): return Photo.objects(route=self).first()

    @property
    def digest(self):
        return {
            'name' : self.name,
            'votes' : self.votesum,
            'regions' : self.regions,
            'photo' : self.photo.json if self.photo else DEFAULT_ROUTE_PHOTO,
            'path' : self.path
        }

    @property
    def json(self):
        return {
            'type' : 'Feature',
            'properties' : {
                'name' : self.name,
                'id' : str(self.id),
                'votes' : self.votesum,
                'regions' : self.regions,
                'photo' : self.photo.json if self.photo else DEFAULT_ROUTE_PHOTO,
                'photos' : [p.json for p in self.photos()],
                'distance' : self.distance,
                'elevations' : self.elevations,
                'path' : self.path
            },
            'geometry': self.coordinates,
        }

class AnonRoute(Route):

    @classmethod
    def get_or_create_anon_route(cls, seg_ids):
        m = md5()
        to_hash = ''.join(seg_ids)
        m.update(to_hash)
        route_id = m.hexdigest()
        route, first_created = cls.objects().get_or_create(id=route_id)
        if not first_created:
            return route
        segs = Segment.objects(id__in=seg_ids)
        regions = set([])
        for seg in segs: regions.add(seg.region)
        route.regions = list(regions)
        path = make_ordered_path(list(segs))
        e = ElevationPath(path)
        route.elevations = e.get_elevations()
        route.coordinates = path.geo_json
        route.distance = len(path)
        route.save()
        return route

    @property
    def name(self):
        return ','.join(self.regions[:-1]) + " and " + self.regions[-1] if len(self.regions) > 3 else " and ".join(self.regions)

    @property
    def path(self):
        return 'route/' + str(self.id)


class NamedRoute(Route):
    name = StringField()

    @classmethod
    def create_named_route_document(cls, segids, name):
        m = md5()
        m.update(name)
        route_id = m.hexdigest()
        segs = Segment.objects(id__in=segids)
        regions = set([])
        for seg in segs: regions.add(seg.region)
        path = make_ordered_path(list(segs))
        e = ElevationPath(path)
        elevations = e.get_elevations()
        if not path:
            return None
        route = cls(id = route_id, coordinates = path.geo_json, regions = list(regions), distance = len(path), name = name, elevations = elevations)
        route.save()
        return route

    @property
    def path(self): return 'named_route/' + '_'.join(self.name.split())

    @property
    def json(self):
        j = super(NamedRoute, self).json
        j['properties'].update({
            'name' : self.name
            # 'link' : '/named_route/' + '_'.join(self.name.split(' ')),
        })
        return j

    @classmethod
    def get_classic_routes(cls, page = 1,limit = 10):
        start = (page - 1) * limit
        return cls.objects()[start:start+limit]

    @classmethod
    def search_classic_routes(cls, search, limit = 8):
        return cls.objects(name__icontains = search)[:limit]

    @classmethod
    def vote(cls, rid): cls.objects(id = rid).update_one(inc__votesum=1)

class User(Document):
    uid = IntField(primary_key=True)
    created = DateTimeField(default= datetime.now)
    first_name = StringField()
    last_name = StringField()
    profile_url = URLField()
    picture = URLField()
    admin = BooleanField()

    @property
    def json(self):
        return {
            'uid' : self.uid,
            'first_name' : self.first_name,
            'last_name' : self.last_name,
            'profile_url' : self.profile_url,
            'picture' : self.picture
        }

    @property
    def profile(self):
        return {
            'user': self.json,
            'routes' : [r.digest for r in UserRoute.objects(user = self.uid)],
            'photos' : [p.json for p in Photo.objects(user = self.uid)]
        }

    # @classmethod
    # def get_or_create(cls, uid):
    #     try:
    #         u = cls.objects(uid= id).get()
    #     except DoesNotExist:
    #         u = cls.objects.create(uid = user.get('id'), first_name = user.get('first_name'), last_name = user.get('last_name'),
    #                 profile_url = user.get('link'), picture = user.get('picture')['data']['url']).update(upsert=True)
    #
    #     return cls.objects(uid=uid).get()

    @classmethod
    def get_user(cls, session):
        uid = session.get("uid")
        if uid:
            try:
                return cls.objects(uid = uid).get()
            except DoesNotExist:
                pass
        return None

class Photo(Document):
    user = ReferenceField(User)
    segment = ReferenceField(Segment)
    route = ReferenceField(Route)
    location = PointField()
    created = DateTimeField(default=datetime.now)
    votesum = IntField()
    s3_key = StringField()
    text = StringField()
    meta = {
        'indexes': ['-created']
    }

    @classmethod
    def recent_photos(cls, limit = 10):
        return cls.objects().order_by('-created')[:limit]

    @property
    def json(self):
        url = current_app.config.get('S3_BUCKET_LINK')
        voted = Vote.has_voted(session['uid'], self.id) if 'uid' in session else False
        return {
            'id' : str(self.id),
            'path' : self.route.path,
            'date' : self.created.strftime('%b. %d, %Y'),
            'location' : self.location,
            'text': self.text[:self.text.find(' ', 150)] + ' ...' if len(self.text) > 200 else self.text,
            'small' : url + self.s3_key + str(SIZES['small'][0]) + 'x' + str(SIZES['small'][1]),
            'medium' : url + self.s3_key + str(SIZES['medium'][0]) + 'x' + str(SIZES['medium'][1]),
            'large' : url + self.s3_key,
            'user' : self.user.json,
            'voted' : voted
        }

    @classmethod
    def vote(cls, pid): cls.objects(id = pid).update_one(inc__votesum=1)


class UserRoute(Document):
    date = DateTimeField(default = datetime.now)
    route = ReferenceField(Route)
    user = ReferenceField(User)
    graph_id = StringField()

    @classmethod
    def set_user_route(cls, route_id):
        ur, created = cls.objects().get_or_create(route = route_id, user = 'user')
        if not created:
            ur.date = datetime.now()
            ur.save()
        return ur

    @property
    def json(self):
        return {
            'route_id' : self.route.id,
            'user_id' : self.user.id
        }


class Vote(Document):
    key = StringField(primary_key=True)

    @classmethod
    def get_or_set_vote(cls, user_id, item_id):
        """

        :param user_id:
        :param item_id:
        :return: a Boolean, indicating that this is the user's first vote for the object.
        """
        k = str(user_id) + str(item_id)
        vote, created = cls.objects().get_or_create(key = k)
        return created

    @classmethod
    def has_voted(cls, user_id, item_id):
        key = str(user_id) + str(item_id)
        vote = cls.objects(key = key).first()
        if vote: return True
        else: return False

class AdminView(BaseView):
    def is_accessible(self):
        user = User.get_user(session)
        if not user or not user.admin: return False
        return True

    @expose('/admin')
    def index(self):
        return self.render('admin/myindex.html')

class UserView(ModelView):
    column_filters = ['last_name', 'first_name']

    column_searchable_list = ('last_name', 'first_name')

class SegmentView(ModelView):
    column_filters = ['region']

class NamedRouteView(ModelView):
    column_filters = ['name']
