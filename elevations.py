import os
import numpy as np
import re
from geo import *
# from flask import current_app
# from models import *
import math

METERS_PER_SAMPLE = 30.0

def find_intermediate_point(p1, p2, d):
    theta = p1.bearing(p2)
    return p1.compute_offset(theta, d)


class ElevationPath(object):
    DIR = 'static/elevations/'
    # SUFFIX = ''
    def __init__(self, path):
        self.path = path
        self.samples = round(len(path) / METERS_PER_SAMPLE)
        self.points = self.sample_points()
        self.make_elevation_arrays()


    def sample_points(self):
        seg_size = METERS_PER_SAMPLE
        current = None
        current_sample_length = 0
        points = []
        for i, point in enumerate(self.path):
            # print "The raw distance remaining in this path is %s" % len(self.path.slice(i))
            if i == 0:
                current = point
                continue
            # what is the distance from current to next
            d_to_next_point = current.distance(point)
            # print "The distance from the %sth point to the %sth point is %s" % (i-1, i, d_to_next_point)
            # print "We currently have %s points" % len(points)
            # print "We have already made a segment that is %s meters long" % current_sample_length
            # if, having gone to next, our total length is great than segsize
            if current_sample_length + d_to_next_point > seg_size:
                delta = seg_size - current_sample_length
                # print "Therefore, we will take a sample %s meters into this new segment" % delta
                remainder = d_to_next_point - delta
                # find an intermediate point, which will make the total length segsize
                p = find_intermediate_point(current, point, delta)
                c_d = current.distance(p)
                # print "To check, this point is %s meters from the start of the segment, for a total distance of %s" % (c_d, current_sample_length + c_d)

                # if len(points) > 0:
                #     check[str(p)] = points[-1].distance(p)
                points.append(p)
                while remainder > seg_size:
                    # print "There are %s meters left in this segment (measured at %s), so we should take %s more points from it" % (remainder, p.distance(point), math.floor(remainder / METERS_PER_SAMPLE))
                    new_p = find_intermediate_point(p, point, seg_size)
                    # print "To check, this point is %s meters from the last point" % p.distance(new_p)
                    points.append(new_p)
                    remainder -= seg_size
                    p = new_p
                current = p
                current_sample_length = remainder
            else:
                current_sample_length += d_to_next_point
                current = point
        return points

    def make_elevation_arrays(self):
        self.arrays = {}
        for point in self.points:
            lat = int(math.floor(point.lat))
            lon = int(math.floor(point.lon))
            if (lat, lon) not in self.arrays:
                lonstr = ("W%d" % abs(lon)) if lon < 0 else ("E%d" % lon)
                latstr = ("S%d" % abs(lat)) if lat < 0 else ("N%d" % lat)
                st = latstr + lonstr + '.hgt'
                self.arrays[(lat, lon)] = ElevationArray(os.path.join(self.DIR, st))
        # print self.arrays

    def get_elevations(self):
        elevations = []
        for point in self.points:
            p = (int(math.floor(point.lat)), int(math.floor(point.lon)))
            el = self.arrays[p].elevation_val(point)
            elevations.append(el)
        return elevations


class ElevationArray(object):
    def __init__(self, filename):
        c = re.findall(r'[A-Z][0-9]+', filename)
        # current_app.logger.debug(c)
        lat = float(c[0][1:]) * (-1 if c[0][0] == 'S' else 1)
        lng = float(c[1][1:]) * (-1 if c[1][0] == 'W' else 1)
        self.bounds = Box(north = lat + 1, east = lng + 1, south = lat, west = lng)
        siz = os.path.getsize(filename)
        dim = int(math.sqrt(siz/2))
        assert dim*dim*2 == siz, 'Invalid file size'
        self.data = np.fromfile(filename, np.dtype('>i2'), dim*dim).reshape((dim, dim))
        np.place(self.data, self.data < 0, 0)
        # self.data = self.data.clip(0, self.data.max())
        self.dimx = self.dimy = dim -1
        # self.contours = set([])
        # self.shape = np.ones(2)

    def index_2_point(self, i, j):
        lng = self.bounds.west + (float(j) / self.dimx)
        lat = self.bounds.south + (float(self.dimy - i) / self.dimy)
        return Point(lat, lng)

    # def save(self):
    #     it = np.nditer(self.data, flags=['multi_index'])
    #     grid = []
    #     while not it.finished:
    #         grid.append(Elevations(elevation=it[0], point = self.index_2_point(*it.multi_index).geo_json))
    #         it.iternext()
    #         if len(grid) == 50:
    #             Elevations.objects.insert(grid)
    #             print "%s Elevation Documents Saved" % len(grid)
    #             grid = []

    def elevate(self, x1, x2, x3, x0):
        x = np.array([x1,x2,x3])
        y = np.array([-1,-1,-1])
        a = np.linalg.solve(x,y)
        return (-1 - a[0] * x0[0] - a[1] * x0[1]) / a[2]

    def elevation_val(self, point):
        x_d = (point.lon - self.bounds.west) * self.dimx
        y_d = self.dimy * (1 - (point.lat - self.bounds.south))
        x_maj = int(round(x_d))
        y_maj = int(round(y_d))
        if x_maj - x_d > 0: x_min = x_maj - 1
        elif x_maj + 1 <= self.dimx: x_min = x_maj + 1
        else: return self.data[y_maj, x_maj]
        if y_maj - y_d > 0: y_min = y_maj - 1
        elif y_maj + 1 <= self.dimy: y_min = y_maj + 1
        else: return self.data[y_maj, x_maj]
        p1 = np.array([x_maj, y_maj, self.data[y_maj, x_maj]])
        p2 = np.array([x_maj, y_min, self.data[y_min, x_maj]])
        p3 = np.array([x_min, y_maj, self.data[y_maj, x_min]])
        els = [l for l in [p1[2], p2[2], p3[2]] if l != 0]
        if len(els) == 2: return sum(els) / 2
        elif len(els) == 1: return sum(els)
        elif len(els) == 0: return 0
        # if len([])
        # if any(p1[2], p2[2], p3[2])
        p0 = np.array([x_d, y_d])
        return self.elevate(p1, p2, p3, p0)



# if __name__ == '__main__':
#     path = sys.argv[1]
#     point = sys.argv[2].split(',')
#     point = Point(float(point[0]), float(point[1]))
#     e = ElevationArray(path)
#     print e.elevation_val(point)