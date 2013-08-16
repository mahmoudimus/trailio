__author__ = 'peterfrance'
from geo import Path
from flask import current_app

def make_ordered_path(segment_list, debug=False, distance=None):
    """
    """
    segments = segment_list[:]
    base = Path(**segments.pop(0).coordinates)
    max_loops = sum(range(len(segments) + 1))
    i = 0
    while segments and i < max_loops:
        current = segments.pop(0)
        c_path = Path(**current.coordinates)
        if not base.extend(c_path):
            segments.append(current)
        i += 1
    if segments:
        current_app.logger.error("Path did not utilize all segments. %s remaining." % len(segments))
    return base

