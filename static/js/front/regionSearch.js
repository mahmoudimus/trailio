define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {

    return Backbone.View.extend({
          el : "#region_search_box"
        , initialize : function(){

            var autocomplete = new google.maps.places.Autocomplete(this.el);
            var map = this.options.map;
            console.log(this)
            autocomplete.bindTo('bounds', map);
            google.maps.event.addListener(autocomplete, 'place_changed', function() {
                var place = autocomplete.getPlace();
                map.setCenter(place.geometry.location);
                map.setZoom(10);});
            }
    });

});
