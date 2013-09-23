import os
import numpy as np
import re
from geo import *
import math
import struct

SAMPLES = 350

def find_intermediate_point(p1, p2, d):
    theta = p1.bearing(p2)
    return p1.compute_offset(theta, d)


class ElevationPath(object):
    def __init__(self, path):
        self.path = path
        self.points = self.sample_points()
        self.make_elevation_arrays()

    def sample_points(self):
        seg_size = max(30, len(self.path) / SAMPLES)
        current = None
        current_sample_length = 0
        points = []
        for i, point in enumerate(self.path):
            if i == 0:
                current = point
                continue
            d_to_next_point = current.distance(point)
            if current_sample_length + d_to_next_point > seg_size:
                delta = seg_size - current_sample_length
                remainder = d_to_next_point - delta
                # find an intermediate point, which will make the total length segsize
                p = find_intermediate_point(current, point, delta)
                points.append(p)
                while remainder > seg_size:
                    new_p = find_intermediate_point(p, point, seg_size)
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
                self.arrays[(lat, lon)] = ElevationArray(st)

    def get_elevations(self):
        elevations = []
        for point in self.points:
            p = (int(math.floor(point.lat)), int(math.floor(point.lon)))
            el = self.arrays[p].elevation_val(point)
            if el != 0 or len(elevations) == 0 or elevations[-1] - el < 100:
                if el > -500:
                    elevations.append(el)
                else:
                    elevations.append(elevations[-1])
        return elevations


class ElevationArray(object):
    DIR = 'static/elevations/'

    def __init__(self, filename):
        c = re.findall(r'[A-Z][0-9]+', filename)
        lat = float(c[0][1:]) * (-1 if c[0][0] == 'S' else 1)
        lng = float(c[1][1:]) * (-1 if c[1][0] == 'W' else 1)
        self.bounds = Box(north = lat + 1, east = lng + 1, south = lat, west = lng)
        self.path = os.path.join(self.DIR, filename)
        siz = os.path.getsize(self.path)
        dim = int(math.sqrt(siz/2))
        self.dimx = self.dimy = dim -1

    def index_2_point(self, i, j):
        lng = self.bounds.west + (float(j) / self.dimx)
        lat = self.bounds.south + (float(self.dimy - i) / self.dimy)
        return Point(lat, lng)

    def elevate(self, x1, x2, x3, x0):
        x = np.array([x1,x2,x3])
        y = np.array([-1,-1,-1])
        a = np.linalg.solve(x,y)
        return (-1 - a[0] * x0[0] - a[1] * x0[1]) / a[2]

    def read_value(self, x, y):
        pos = (3601*2*y + 2*x)
        with open(self.path) as file_object:
            file_object.seek(pos)
            (value,) = struct.unpack('>h', file_object.read(2))
        return value

    def elevation_val(self, point):
        x_d = (point.lon - self.bounds.west) * self.dimx
        y_d = self.dimy * (1 - (point.lat - self.bounds.south))
        x_maj = int(round(x_d))
        y_maj = int(round(y_d))
        if x_maj - x_d > 0: x_min = x_maj - 1
        elif x_maj + 1 <= self.dimx: x_min = x_maj + 1
        else: return self.read_value(x_maj, y_maj)
        if y_maj - y_d > 0: y_min = y_maj - 1
        elif y_maj + 1 <= self.dimy: y_min = y_maj + 1
        else: return self.read_value(x_maj, y_maj)
        # self.data[y_maj, x_maj]
        p1 = np.array([x_maj, y_maj, self.read_value(x_maj, y_maj)])
        p2 = np.array([x_maj, y_min, self.read_value(x_maj, y_min)])
        p3 = np.array([x_min, y_maj, self.read_value(x_min, y_maj)])
        els = [l for l in [p1[2], p2[2], p3[2]] if l != 0]
        if len(els) == 2: return sum(els) / 2
        elif len(els) == 1: return sum(els)
        elif len(els) == 0: return 0
        p0 = np.array([x_d, y_d])
        return self.elevate(p1, p2, p3, p0)

# class ElevationArrayOld(object):
#     DIR = 'static/elevations/'
#
#     def __init__(self, filename):
#         c = re.findall(r'[A-Z][0-9]+', filename)
#         lat = float(c[0][1:]) * (-1 if c[0][0] == 'S' else 1)
#         lng = float(c[1][1:]) * (-1 if c[1][0] == 'W' else 1)
#         self.bounds = Box(north = lat + 1, east = lng + 1, south = lat, west = lng)
#         path = os.path.join(self.DIR, filename)
#         siz = os.path.getsize(path)
#         dim = int(math.sqrt(siz/2))
#         assert dim*dim*2 == siz, 'Invalid file size'
#         self.data = np.fromfile(path, np.dtype('>i2'), dim*dim).reshape((dim, dim))
#         np.place(self.data, self.data < 0, 0)
#         self.dimx = self.dimy = dim -1
#
#     def index_2_point(self, i, j):
#         lng = self.bounds.west + (float(j) / self.dimx)
#         lat = self.bounds.south + (float(self.dimy - i) / self.dimy)
#         return Point(lat, lng)
#
#     def elevate(self, x1, x2, x3, x0):
#         x = np.array([x1,x2,x3])
#         y = np.array([-1,-1,-1])
#         a = np.linalg.solve(x,y)
#         return (-1 - a[0] * x0[0] - a[1] * x0[1]) / a[2]
#
#     def elevation_val(self, point):
#         x_d = (point.lon - self.bounds.west) * self.dimx
#         y_d = self.dimy * (1 - (point.lat - self.bounds.south))
#         x_maj = int(round(x_d))
#         y_maj = int(round(y_d))
#         if x_maj - x_d > 0: x_min = x_maj - 1
#         elif x_maj + 1 <= self.dimx: x_min = x_maj + 1
#         else: return self.data[y_maj, x_maj]
#         if y_maj - y_d > 0: y_min = y_maj - 1
#         elif y_maj + 1 <= self.dimy: y_min = y_maj + 1
#         else: return self.data[y_maj, x_maj]
#         p1 = np.array([x_maj, y_maj, self.data[y_maj, x_maj]])
#         p2 = np.array([x_maj, y_min, self.data[y_min, x_maj]])
#         p3 = np.array([x_min, y_maj, self.data[y_maj, x_min]])
#         els = [l for l in [p1[2], p2[2], p3[2]] if l != 0]
#         if len(els) == 2: return sum(els) / 2
#         elif len(els) == 1: return sum(els)
#         elif len(els) == 0: return 0
#         p0 = np.array([x_d, y_d])
#         return self.elevate(p1, p2, p3, p0)
