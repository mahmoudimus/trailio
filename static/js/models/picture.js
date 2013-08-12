define([
    'jquery',
    'underscore',
    'backbone',
    'gmaps'
], function($, _, Backbone){
    return Backbone.Model.extend({
        url:'/_json/journal',
        initialize: function(){
            var point = this.get('point').split(',');
            var lat = point[0];
            var lng = point[1];
            this.set('latlng',new google.maps.LatLng(lat, lng));
            var icon = this.get('images').small_icon;

            this.set('marker', new google.maps.Marker({
                position:this.get('latlng'),
                icon:icon
            }));
            this.trigger('markerset')
        }

    });
});
