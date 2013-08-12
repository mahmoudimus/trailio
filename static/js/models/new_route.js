define([
    'jquery',
    'underscore',
    'backbone',
    'globals',
    'models/routesegmentmodel'
    ], function ($, _, Backbone, Globals, SegmentModel) {

    var Photo = Backbone.Model.extend({
        parse: function(response){
            var location = new google.maps.LatLng(response.location[0], response.location[1]);
            return {
                location: location,
                photo_id: response.photo_id,
                voted: response.voted,
                text: response.text,
                images: response.images,
                marker: new google.maps.Marker({
                    position: location,
                    icon: response.images.small_icon
                })
            }
        }
    });

    var Photos = Backbone.Collection.extend({
        model: Photo
//        parse: function(response){
//            return response
//        }
    });

    var Section = SegmentModel.extend({
        parse: function(response){
            return {
                width: response.width,
                coordinates: response.coordinates,
                elevations: response.elevations,
                bounds: response.bounds
            }
        }
    });

    var Sections = Backbone.Collection.extend({
        model: Section
        });

    return Backbone.Model.extend({

        urlRoot: '/_json/r'

        , TopoUrlTemplate:_.template('http://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/export?bbox=<%=west%>,<%=south%>,<%=east%>,<%=north%>&bboxSR=4326&layers=&layerdefs=&size=<%=size%>&dpi=256&imageSR=4326&format=jpg&f=pjson')

        , initialize: function(){
            var that = this;
            _.bindAll(this);

            this.on('next', function(i){
                var section = this.get('sections').at(i);
                var size = parseInt(_.min([2048, section.get('width') / 3]));
                var url = this.TopoUrlTemplate({north:section.get('bounds')[0].toString() , east:section.get('bounds')[1].toString(),
                                            south:section.get('bounds')[2].toString() , west:section.get('bounds')[3].toString(),
                                            size:size.toString() + ',' + size.toString()});
                $.ajax({
                    url: url,
                    success: function(data) {
                        var bounds = new google.maps.LatLngBounds(
                                        new google.maps.LatLng(data.extent.ymin, data.extent.xmin),
                                        new google.maps.LatLng(data.extent.ymax, data.extent.xmax)
                                    );
                        section.set({
                                bounds: bounds,
                                topo: data.href,
                                overlay: new google.maps.GroundOverlay(data.href, bounds)
                        });
                        var img = new Image();
                        img.src = data.href;
                        if (i+1 < that.get('sections').length) {
                            that.trigger('next', i + 1);
                        } else {
                            img.onload = function() {
                                that.set('loaded', true);
                                that.trigger('topoload')
                            }
                        }
                    },
                    dataType: 'jsonp'
                });
            }, this);

            if (this.get('sections').length > 0){
                this.trigger('next', 0)
            } else {
                this.once('change:sections', function() {
                    this.trigger('next', 0)
                });
            }
            if (!Globals.route || !Globals.route.path == location.pathname) this.fetch();
        }
        , reverse : function(){
            this.get('sections').reverse();
//            todo: elevations
            this.get('sections').each(function(section){
                section.coordinates.reverse();
                section.elevations.reverse();
            }, this);
        }
        , parse : function(response) {
            return {
                sections : new Sections(response.sections, {parse:true}),
                photos: new Photos(response.photos, {parse:true}),
                name : response.name,
                distance : response.distance,
                elevation_gain : response.elevation_gain,
                voted : response.voted,
                elevations : response.elevations,
                path: response.path,
                id: response.id
            }
        }
    });
});
