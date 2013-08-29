define([
    'jquery',
    'underscore',
    'backbone',
    "handlebars",
    'text!templates/route_map.html',
    'utils',
    'main/gmaps',
    'libs/spin'
], function($, _, Backbone, Handlebars, RouteMapTemplate, Utils){
    var icon = {
          path : google.maps.SymbolPath.CIRCLE
        , scale : 5
        , fillOpacity : 1
        , strokeWeight : 0
    };


    return Backbone.View.extend({

          initialize:function () {
            _.bindAll(this);
        }
        , photo_marker : null
        , events: {
              "click #reverse": "reverse"
            , "click #set_topo": "settopo"
        }
        , render:function () {
            var template = Handlebars.compile(RouteMapTemplate);
            this.$el.html(template());
            return this
        }

        , drawmap: function() {
            var mapOptions = {
                  zoom : 10
                , zoomControl:true
                , minZoom:8
                , maxZoom:15
                , center:Utils.GetLocation() || new google.maps.LatLng(37.1, -118.5)
                , mapTypeId:google.maps.MapTypeId.TERRAIN
                , disableDefaultUI:true
                , scrollwheel:false
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
            var p_icon = _.extend({fillColor : "yellow"}, icon);
            this.photo_marker = new google.maps.Marker({
                  map : this.map
                , position : new google.maps.LatLng(point[1], point[0])
                , icon : p_icon
            })
        }

        , drawmarkers: function() {
            var node1 = this.model.get('geometry').coordinates[0];
            var node2 = _.last(this.model.get('geometry').coordinates);
            var start = _.extend({fillColor : "green"}, icon);
            var end = _.extend({fillColor : "red"}, icon);
            this.marker1 = new google.maps.Marker({
                  map : this.map
                , position : new google.maps.LatLng(node1[1], node1[0])
                , icon : start
            });
            this.marker2 = new google.maps.Marker({
                  map:this.map
                , position: new google.maps.LatLng(node2[1], node2[0])
                , icon : end
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