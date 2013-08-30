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
            this.photo_marker = new google.maps.Marker({
                  map : this.map
                , position : new google.maps.LatLng(point[1], point[0])
                , icon : {
                      path : google.maps.SymbolPath.CIRCLE
                    , scale : 5
                    , fillOpacity : 1
                    , strokeWeight : 0
                    , fillColor : "yellow"
                }
            })
        }

        , drawmarkers: function() {
            this.model.get("start").setMap(this.map);
            this.model.get("end").setMap(this.map);
        },

        removemarkers: function() {
            this.model.get("start").setMap(null);
            this.model.get("end").setMap(null);
        },

        close:function () {
            this.remove();
            this.unbind();
        }
    });
});