__author__ = 'peterfrance'
import math
from collections import MutableSequence
RADIUS = 6378135



class Path(MutableSequence):

    def __init__(self, *args, **kwargs):
        if kwargs.get('type') == 'Feature':
            geo, properties, fields = kwargs.get('geometry'), kwargs.get('properties'), kwargs.get('name_keys', [])
        else:
            geo, properties, fields = kwargs, None, None
        if geo.get('type') == "MultiLineString":
            base_array = geo.get('coordinates').pop(0)
            base_path = Path(**{"type": "LineString", "coordinates" : base_array})
            for line in geo.get('coordinates'):
                p = Path(**{"type": "LineString", "coordinates" : line})
                base_path.extend(p)
            self._list = base_path.list
        if geo.get('type') == "LineString":
            self._list = [Point(lat = p[1], lon=p[0]) for p in geo['coordinates']]
        # names = set([])
        # if fields:
        #     for n in fields:
        #         names.add(properties[n])
        # self.names = list(names) if None not in names else []
        self.properties = properties
        self._step = 1
    def __delitem__(self, key):
        del self.list[key]

    def __getitem__(self, item):
        return self.list[item]

    def slice(self, i, j = None):
        if not j: j = len(self.list)
        return Path({'type' : 'LineString', 'coordinates': [[p.lon, p.lat] for p in self.list[i:j]]})

    def __len__(self):
        l = 0
        for i in range(1, len(self.list)):
            l += self._list[i].distance(self.list[i-1])
        return l

    def __setitem__(self, key, value):
        self.list[key] = value


    def __iter__(self):
        return iter(self.list)

    def reverse(self):
        self._list = self._list[::-1]

    @property
    def geo_json(self):
        return {'type' : 'LineString', 'coordinates': [[p.lon, p.lat] for p in self.list]}

    @property
    def list(self):
        l = [self._list[i] for i in range(0, len(self._list), self._step)]
        if self._list[-1] not in l:
            l += [self._list[-1]]
        return l

    def insert(self, index, value):
        # todo: make sure value type is correct
        # if type(value)==
        self.list.insert(index, value)
    @property
    def nodes(self):
        s = "%.3f, %.3f"
        return s % (self.list[0].lon, self.list[0].lat), s % (self.list[-1].lon, self.list[-1].lat)

    def extend(self, other):
        first, last = self.nodes
        o_first, o_last = other.nodes
        if o_first == first:
            self._list = other._list[::-1] + self._list
            return True
        elif o_first == last:
            self._list = self._list + other._list
            return True
        elif o_last == first:
            self._list = other._list + self._list
            return True
        elif o_last == last:
            self._list = self._list + other._list[::-1]
            return True
        return False

    # @property
    # def length(self):
    #     l = 0
    #     for i in range(1, len(self.list)):
    #         l += self.list[i].distance(self.list[i-1])
    #     return l


class Point(object):
    """A two-dimensional point in the [-90,90] x [-180,180] lat/lon space.

    Attributes:
    lat: A float in the range [-90,90] indicating the point's latitude.
    lon: A float in the range [-180,180] indicating the point's longitude.
    """
    TOL = 0.0001
    def __init__(self, lat, lon):
        """Initializes a point with the given latitude and longitude."""
        if lat and lon:
            if -90 > lat or lat > 90:
                raise ValueError("Latitude must be in [-90, 90] but was %f" % lat)
            if -180 > lon or lon > 180:
                raise ValueError("Longitude must be in [-180, 180] but was %f" % lon)

        self.lat = lat
        self.lon = lon

    def __eq__(self, other):
        return abs(self.lat - other.lat) < self.TOL and abs(self.lon - other.lon) < self.TOL

    def __str__(self):
        return '(%f, %f)' % (self.lat, self.lon)

    def __repr__(self):
        return '(%f, %f)' % (self.lat, self.lon)

    def __nonzero__(self):
        if self.lat and self.lon: return True
        return False

    def distance(self, other):
        selflat, selflon = math.radians(self.lat), math.radians(self.lon)
        otherlat, otherlon = math.radians(other.lat), math.radians(other.lon)
        sloc = ((math.sin(selflat) * math.sin(otherlat)) + (math.cos(selflat) * math.cos(otherlat) * math.cos(otherlon - selflon)))
        sloc = max(min(sloc, 1.0), -1.0)
        return RADIUS * math.acos(sloc)

    def bearing(self, other):
        lat1, lat2 = math.radians(self.lat), math.radians(other.lat)
        lon1, lon2 = math.radians(self.lon), math.radians(other.lon)
        dlon =  lon2 - lon1
        y = math.sin(dlon) * math.cos(lat2)
        x = math.cos(lat1) * math.sin(lat2) -\
            math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
        return math.degrees(math.atan2(y, x)) % 360


    def node(self):
        return "%.3f, %.3f" % (self.lat, self.lon)

    @property
    def geo_json(self):
        return {
            'type' : "Point",
            'coordinates' :[self.lon, self.lat]
        }

    def compute_offset(self, bearing, distance):
        """

        :param bearing:
        :param distance:
        :return: new Point object
        """
        r_distance = float(distance)/RADIUS
        r_bearing = math.radians(float(bearing))
        lat1, lon1 = math.radians(self.lat), math.radians(self.lon)
        lat2 = math.asin(
                        math.sin(lat1) * math.cos(r_distance) +
                        math.cos(lat1) * math.sin(r_distance) * math.cos(r_bearing)
                        )
        lon2 = lon1 + math.atan2(
                        math.sin(r_bearing) * math.sin(r_distance) * math.cos(lat1),
                        math.cos(r_distance) - math.sin(lat1) * math.sin(lat2)
                        )
        return Point(math.degrees(lat2), math.degrees(lon2))


class Box(object):
    """A two-dimensional rectangular region defined by NE and SW points.

    Attributes:
    north_east: A read-only geotypes.Point indicating the box's Northeast
        coordinate.
    south_west: A read-only geotypes.Point indicating the box's Southwest
        coordinate.
    north: A float indicating the box's North latitude.
    east: A float indicating the box's East longitude.
    south: A float indicating the box's South latitude.
    west: A float indicating the box's West longitude.
    """

    def __init__(self, north=None, east=None, south=None, west=None):
        if north and east and south and west:
            if south > north:
                south, north = north, south

        # Don't swap east and west to allow disambiguation of
        # antimeridian crossing.

        self._ne = Point(north, east)
        self._sw = Point(south, west)
        # else:
        # 	self._ne = None
        # 	self._sw = None

    north_east = property(lambda self: self._ne)
    south_west = property(lambda self: self._sw)

    def _set_north(self, val):
        if val < self._sw.lat:
            raise ValueError("Latitude must be north of box's south latitude")
        self._ne.lat = val
    north = property(lambda self: self._ne.lat, _set_north)

    def _set_east(self, val):
        self._ne.lon = val
    east  = property(lambda self: self._ne.lon, _set_east)

    def _set_south(self, val):
        if val > self._ne.lat:
            raise ValueError("Latitude must be south of box's north latitude")
        self._sw.lat = val
    south = property(lambda self: self._sw.lat, _set_south)

    def _set_west(self, val):
        self._sw.lon = val
    west  = property(lambda self: self._sw.lon, _set_west)

    def __eq__(self, other):
        return self._ne == other._ne and self._sw == other._sw

    def __str__(self):
        return '[%f, %f, %f, %f]' % (self.north, self.east, self.south, self.west)

    def geo_json(self):
        return {'type': 'Polygon',
                'coordinates': [[
                    [self.west, self.south],
                    [self.west, self.north],
                    [self.east, self.north],
                    [self.east, self.south],
                    [self.west, self.south],
                ]]
                }

    def contains(self, point):
        return self.south < point.lat < self.north and self.west < point.lon < self.east

    def extend(self, point):
        if self._ne and self._sw:
            if point.lat < self.south: self.south = point.lat
            elif point.lat > self.north: self.north = point.lat
            elif point.lon > self.east: self.east = point.lon
            elif point.lon < self.west: self.west = point.lon
        else:
            self._ne = Point(point.lat, point.lon)
            self._sw = Point(point.lat, point.lon)


    @property
    def centroid(self):
        return Point((self.north+self.south)/2, (self.east+self.west)/2)

