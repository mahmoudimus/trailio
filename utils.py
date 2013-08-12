__author__ = 'peterfrance'
from geo import Path

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
    if segments: return None
    return base


#     G = {}
#     for seg in segment_list:
#
#
#         path = Path(**seg.coordinates)
#         first, last = path.nodes
#         if first in G:
#             G[first].append(seg.key().name())
#         else:
#             G[node1] = [seg.key().name()]
#         if node2 in G:
#             G[node2].append(seg.key().name())
#         else:
#             G[node2] = [seg.key().name()]
#         H[seg.key().name()] = (node1, node2, seg)
#     # 	allow for connected circuit
#     for i, node in enumerate(G):
#         if len(G[node]) == 1:
#             current_node = node
#             straighten(G, H, L, current_node, marked_segs, marked_nodes)
#             break
#         # 	if all are connected, just pick one
#         if i == len(G)-1:
#             current_node = G.keys()[0]
#             straighten(G, H, L, current_node, marked_segs, marked_nodes)
#     return L
#
#
# def straighten(G, H, L, current_node, marked_segs, marked_nodes):
#     """
#     A function that recursively moves down a connected route, adding segments to nodes in order
#     """
#
#     cont = False
#     next_seg = 0
#     marked_nodes.append(current_node)
#     # see which segs are connected to the current node
#     for seg in G[current_node]:
#         # if there is one that we haven't used..
#         if seg not in marked_segs:
#             # use it
#             next_seg = seg
#             marked_segs.append(next_seg)
#             cont = True
#             break
#     # if we haven't found anything connected to this node...
#     # dump whatever's left into the list, and halt the function
#     if not cont:
#         if DEBUG:
#             logging.info('\n'.join(['Node: ' + node + ' --> ' + " , ".join(seg)
#                         for node, seg in G.items()]))
#             logging.info('\n'.join(['Seg: ' + seg + ' --> ' + nodes[0] + ' , ' + nodes[1]
#                         for seg, nodes in H.items()]))
#         for sid in (set(H.keys())-set(marked_segs)):
#             H[sid][2].reverse = False
#             L.append(H[sid][2])
#         return
#     # We will consider the direction we are going to be forward,
#     # so if the node we are on is the next segment's node2 (index 1), then mark the seg as reversed
#     # and use the opposite node as the next one
#     #
#     # reverse = bool(H[next_seg].index(current_node))
#     # opposite = int(not reverse)
#     # newnode = H[next_seg][opposite]
#     #
#     if H[next_seg].index(current_node) == 1:
#         reverse = True
#         newnode = H[next_seg][0]
#     # Otherwise it's normal, still use the opposite node as the next one
#     else:
#         reverse = False
#         newnode = H[next_seg][1]
#     # apply the reverse value to the Segment model itself
#     H[next_seg][2].reverse = reverse
#     if reverse:
#         H[next_seg][2].coordinates.reverse()
#         H[next_seg][2].elevations.reverse()
#     # add the segment to the list
#     L.append(H[next_seg][2])
#
#     if newnode not in marked_nodes:
#         current_node = newnode
#     # if we aren't done yet, call straighten recursively
#     if len(L)<len(H) and cont:
#         straighten(G, H, L, current_node, marked_segs, marked_nodes)