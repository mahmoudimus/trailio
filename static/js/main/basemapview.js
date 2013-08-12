define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'gmaps',
    'libs/spin'

], function($, _, Backbone, Utils){
    return Backbone.View.extend({
    //todo: make this el a div containing well, canvas and scales
        drawmap:function () {
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
        }
    });
});