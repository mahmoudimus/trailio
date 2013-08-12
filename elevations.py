import os
import numpy as np
import re
from geo import *
from models import *
import math

# def get_intermediate_point(delta, current, point):
#     tol = 10
#     def line(lng):
#         sl = (point.lat - current.lat) / (point.long - current.lon)
#         b = current.lat - current.lon
#         return sl * lng + b
#
#     def search(lon):
#         new_p = Point(line(lon), lon)
#         new_d = current.distance(new_p)
#         if delta - tol < new_d < delta + tol:
#             return new_p
#         elif new_d > delta + tol:
#
#         elif new_d < delta + tol:



    # def search():

    # p1 = np.array([current.lat, current.lon])
    # p2 = np.array([point.lat, point.lon])
    # b = p2 - p1
    # c = np.array([current.lat, point.lon]) - p1
    # bearing = math.acos(np.dot(b, c) /(np.linalg.norm(b) * np.linalg.norm(c)))
    # # current_app.logger.debug(bearing)
    # # current_app.logger.debug(delta)
    # return current.compute_offset(bearing, delta)

# def something():
#     delta = segsize - current_length
#     # find an intermediate point, which will make the total length segsize
#     p = get_intermediate_point(delta, current, point)
#     points.append(p)
#     current = p
#     current_length = D - delta


class ElevationPath(object):
    DIR = 'static/elevations/'
    SUFFIX = ''
    def __init__(self, path, samples):
        self.path = path
        self.samples = samples
        self.points = self.sample_points()
        self.make_elevation_arrays()
        # self.cells = {int(math.floor(p.lon)) for p in self.points}
        # latrange = {int(math.floor(p.lat)) for p in self.points}


    def sample_points(self):
        seg_size_deg = len(self.path) / self.samples
        current = self.path[0]
        current_length = 0
        points = []
        for i, point in enumerate(self.path):
            if i == 0: continue
            # what is the distance from current to next
            D = current.distance(point)
            # if, having gone to next, our total length is great than segsize
            if current_length + D > segsize:

                delta = segsize - current_length
                # find an intermediate point, which will make the total length segsize
                p = get_intermediate_point(delta, current, point)
                points.append(p)
                current = p
                current_length = D - delta


            else:
                current_length += current.distance(point)
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
        current_app.logger.debug(c)
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
        p0 = np.array([x_d, y_d])
        return self.elevate(p1, p2, p3, p0)



# if __name__ == '__main__':
#     path = sys.argv[1]
#     point = sys.argv[2].split(',')
#     point = Point(float(point[0]), float(point[1]))
#     e = ElevationArray(path)
#     print e.elevation_val(point)