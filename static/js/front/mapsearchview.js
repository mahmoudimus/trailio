define([
    'jquery',
    'underscore',
    'backbone',
    'templates/templates',
    'utils'

], function($, _, Backbone, Templates, Utils){
    return Backbone.View.extend({
        el : "#map_div",

        initialize:function () {
            _.bindAll(this);
            var that = this;
            this.collection.on('sync', this.drawlines, this);
            this.drawmap();
            google.maps.event.addListener(this.map, 'zoom_changed', function() {
                var refresh = $('#ref-map');
                if (that.map.getZoom() < 10){
                    refresh.prop('disabled', true)
                } else{
                    refresh.prop('disabled', false)
                }
            });
            this.collection.on('change:selected sync', function(){
                $('#show-trail').toggleClass('disabled', (this.collection.selected.length==0));
            }, this);

            this.collection.on('continuous', function() {
                $('#map_canvas').append(Templates.seg_select_error());
                var $error = $('.alert-error');
                $error.css({
                    'position':'absolute',
                    'right':    '0px'
                });
                $error.delay(2000).fadeOut(400);
            }, this)

        },
        drawmap:function () {
            var mapOptions = {
                zoom:10,
                zoomControl:true,
                minZoom:8,
                maxZoom:15,
                center: Utils.GetLocation() || new google.maps.LatLng(37.1, -118.5),
                mapTypeId: google.maps.MapTypeId.TERRAIN,
                disableDefaultUI:true,
                scrollwheel:false
            };
            this.map = new google.maps.Map(this.$('#map_canvas')[0], mapOptions);
        },

        drawlines:function () {
            console.log('drawlines')
            console.log(this.collection.models)
            _.each(this.collection.models, function (seg) {
                seg.get('polyline').setMap(this.map);
            }, this);
        },

        clearlines:function () {
            if (this.collection) {
                _.each(this.collection.models, function (seg) {
                    seg.get('polyline').setMap(null);
                }, this);
            }
        }

    });


});