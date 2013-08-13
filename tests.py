import unittest2
import json
from geo import Path, Point
from elevations import ElevationPath, find_intermediate_point

class TestGeo(unittest2.TestCase):
    def setUp(self):
        with open('test_data.json') as td:
            self.collection = json.load(td)
        features = self.collection.get('features')
        self.path1 = Path(name_keys = ['TRAILNAME'], **features[0])
        self.path2 = Path(name_keys = ['TRAILNAME'], **features[1])

    def test_points(self):
        p1, p2, p3 = self.path1[0], self.path1[1], self.path1[3]
        self.assertTrue(p1 == Point(36.737297, -118.716763))
        self.assertTrue(p2 == Point(36.736974, -118.716194))
        self.assertAlmostEqual(p1.distance(p2), 62.16, delta = 1)
        self.assertAlmostEqual(p2.distance(p3), 157.931, delta = 1)
        self.assertEqual(p1.distance(p2), p2.distance(p1))
        self.assertEqual(p2.distance(p3), p3.distance(p2))

        p_a = p1.compute_offset(0.00001, 100)
        self.assertGreater(p_a.lat, p1.lat)
        self.assertAlmostEqual(p_a.lon, p1.lon, 4)
        # self.assertAlmostEqual(p1.bearing(p_a), 0, 4)

        p_b = p1.compute_offset(90, 100)
        self.assertGreater(p_b.lon, p1.lon)
        self.assertAlmostEqual(p_b.lat, p1.lat, 4)
        self.assertAlmostEqual(p1.bearing(p_b), 90.0, 2)

        p_c = p1.compute_offset(180.0001, 100)
        self.assertLess(p_c.lat, p1.lat)
        self.assertAlmostEqual(p_c.lon, p1.lon, 4)
        self.assertAlmostEqual(p1.bearing(p_c), 180.0, 2)

        d_1 = p1.distance(p2)
        d_2 = p2.distance(p3)
        new_p2 = find_intermediate_point(p1, p2, d_1)
        new_p3 = find_intermediate_point(p2, p3, d_2)
        self.assertEqual(new_p2, p2)
        self.assertEqual(new_p3, p3)


    def test_elevation_path(self):
        # el_path_1 = ElevationPath(self.path1)
        # elevations_1 = el_path_1.get_elevations()
        # self.assertEqual(len(elevations_1), el_path_1.samples)

        el_path_2 = ElevationPath(self.path2)
        elevations_2 = el_path_2.get_elevations()
        self.assertEqual(len(elevations_2), el_path_2.samples)
        # print self.el_path.get_elevations()
