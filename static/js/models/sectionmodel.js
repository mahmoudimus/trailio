define([
    'jquery',
    'underscore',
    'backbone',
    'gmaps'
], function($, _, Backbone){

    var degrees = function(span){
    /*
    * takes the span of a bounds
    * returns the degrees (from 0-North) needed to expand the bounds toward a square
    * */
        var ratio = span.lat()/span.lng();
        return Math.atan(ratio) *180/Math.PI;
    };
    return Backbone.Model.extend({

        factor: 42000,
        defaults: {
            querybounds: new google.maps.LatLngBounds(new google.maps.LatLng(0,0), new google.maps.LatLng(0,0)) //a google.maps bounds object
        },
        urlTemplate:_.template('http://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/export?bbox=<%=west%>,<%=south%>,<%=east%>,<%=north%>&bboxSR=4326&layers=&layerdefs=&size=<%=size%>&dpi=256&imageSR=4326&format=jpg&f=pjson'),

        url: function() {
            var bounds = this.get("querybounds");
            var span = bounds.toSpan();
            var heading = degrees(span);
            var heading2 = (heading + 180)%360;
            bounds.extend(google.maps.geometry.spherical.computeOffset(bounds.getNorthEast(), 1500, heading));
            bounds.extend(google.maps.geometry.spherical.computeOffset(bounds.getSouthWest(), 1500, heading2));
            var newspan = bounds.toSpan();
            var ubounds = bounds.toUrlValue().split(',');
            var width = newspan.lng()*this.factor;
            width <=2048 || (width = 2048);
            var height = newspan.lat()*this.factor;
            height <=2048 || (height = 2048);
            var size = Math.round(width).toString() + ',' + Math.round(height).toString();
            return this.urlTemplate({north:ubounds[2], east:ubounds[3], south:ubounds[0], west:ubounds[1], size:size})
        },

        initialize: function() {
            this.on('sync', function() {
                var SW = new google.maps.LatLng(this.get("extent").ymin, this.get("extent").xmin);
                var NE = new google.maps.LatLng(this.get("extent").ymax, this.get("extent").xmax);
                var bounds = new google.maps.LatLngBounds(SW, NE);
                this.set('bounds', bounds);
                this.set('topo',new google.maps.GroundOverlay(
                    this.get('href'),
                    this.get('bounds')));
            }, this);
        },

        sync: function(method, model, options){
//            options.timeout = 1000;
            options.dataType = "jsonp";
//            options.jsonp = false;
            return Backbone.sync(method, model, options);
        }
    });
});
