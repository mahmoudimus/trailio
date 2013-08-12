/**
 * Created with PyCharm.
 * User: peterfrance
 * Date: 10/13/12
 * Time: 1:42 PM
 * To change this template use File | Settings | File Templates.
 */
define([
    'jquery',
    'underscore',
    'backbone'

], function($, _, Backbone){

    return Backbone.View.extend({
        className:'item',
        attributes: {
            style:"float:left"
        },
        initialize: function() {
            _.bindAll(this, 'drawmap', 'drawlines', 'drawmarkers');
            this.drawmap();
            this.drawlines();
        },
        drawlines: function() {
            var path = this.model.get('coordinates');
            var polyOptions = {
                path:path,
                strokeColor:'#004CFF',
                strokeOpacity:1.0,
                strokeWeight:3
            };
            var poly = new google.maps.Polyline(polyOptions);
            poly.setMap(this.map);
        },

        drawmap:function () {
            var bounds = this.options.bounds;
            var latlng = bounds.getCenter();
            var ratio = bounds.toSpan().lng()/bounds.toSpan().lat();
            if (ratio > 1){
                this.$el.css('width', '100%');
                this.$el.height(400);
            }else {
                this.$el.css('width', '372px');
                this.$el.height(800);
            }
            var mapOptions = {
                zoom:12,
                minZoom:10,
                maxZoom:15,
                center:latlng,
                mapTypeId:google.maps.MapTypeId.TERRAIN,
                disableDefaultUI:true,
                scrollwheel:false,
                styles:[
                    {
                        "featureType":"road.local",
                        "stylers":[
                            { "visibility":"off" }
                        ]
                    }
                ]
            };
            this.map = new google.maps.Map(this.$el[0], mapOptions);
        },
        drawmarkers: function() {
            var node1 = this.model.get('coordinates')[0];
            var node2 = _.last(this.model.get('coordinates'));
            this.marker1 = new google.maps.Marker({
                map:this.map,
                position:node1,
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
                position:node2,
                icon:{
                    path:google.maps.SymbolPath.CIRCLE,
                    fillColor:"red",
                    scale:5,
                    fillOpacity:1,
                    strokeWeight:0
                }
            });
        },
        settopo: function(){
            var that = this;
            this.model.on('sync', function() {
                this.model.get('topo').setMap(this.map)
            }, this);
            if (this.model.has('topo')) {
                this.model.get("topo").setMap(this.map);
            } else {
                setTimeout(function () {
                    that.model.fetch()
                }, 500);
             }
        }
    });
});
