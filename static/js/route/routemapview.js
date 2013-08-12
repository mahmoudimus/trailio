define([
    'jquery',
    'underscore',
    'backbone',
    'templates/templates',
    'utils',
    'gmaps',
    'libs/spin'
], function($, _, Backbone, Templates, Utils){

    return Backbone.View.extend({

          initialize:function () {
            _.bindAll(this);
        }
        , photo_marker : null
        , events: {
            "click #reverse": "reverse",
            "click #set_topo": "settopo"
        }
        , render:function () {
            this.$el.html(Templates.route_map_div);
            return this
        }

        , drawmap: function() {
            var mapOptions = {
                zoom:10,
                zoomControl:true,
                minZoom:8,
                maxZoom:15,
                center:Utils.GetLocation() || new google.maps.LatLng(37.1, -118.5),
                mapTypeId:google.maps.MapTypeId.TERRAIN,
                disableDefaultUI:true,
                scrollwheel:false
            };
            this.map = new google.maps.Map($('#map_canvas')[0], mapOptions);
            this.model.get('polyline').setMap(this.map);
            var mapbounds = new google.maps.LatLngBounds();
            _.each(this.model.get('polyline').getPath().getArray(), function(point, i){
                mapbounds.extend(point)
            }, this);
            this.map.fitBounds(mapbounds);
            this.drawmarkers();


        }
        , reverse: function() {
            this.removemarkers();
            this.model.reverse();
            this.drawmarkers();

        }

        , set_photo_marker : function(point){
            if (this.photo_marker){
                this.photo_marker.setMap(null)
            }

            this.photo_marker = new google.maps.Marker({
                  map : this.map
                , position : new google.maps.LatLng(point[1], point[0])
                , icon : {
                      path : google.maps.SymbolPath.CIRCLE
                    , fillColor : "yellow"
                    , scale : 5
                    , fillOpacity : 1
                    , strokeWeight : 0
                }
            })
        }

        , drawmarkers: function() {
            var node1 = this.model.get('geometry').coordinates[0];
            var node2 = _.last(this.model.get('geometry').coordinates);
            this.marker1 = new google.maps.Marker({
                map: this.map,
                position: new google.maps.LatLng(node1[1], node1[0]),
                icon:{
                    path:google.maps.SymbolPath.CIRCLE,
                    fillColor:"green",
                    scale:5,
                    fillOpacity:1,
                    strokeWeight:0
                }
            });
            this.marker2 = new google.maps.Marker({
                map:this.map,
                position: new google.maps.LatLng(node2[1], node2[0]),
                icon:{
                    path:google.maps.SymbolPath.CIRCLE,
                    fillColor:"red",
                    scale:5,
                    fillOpacity:1,
                    strokeWeight:0
                }
            });
        },

        removemarkers: function() {
            this.marker1.setMap(null);
            delete this.marker1;
            this.marker2.setMap(null);
            delete this.marker2;
        },

        close:function () {
            this.remove();
            this.unbind();
        }
    });
});