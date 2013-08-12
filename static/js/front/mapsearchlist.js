define([
    'jquery',
    'underscore',
    'backbone'
], function($, _, Backbone){
    function compare(node1, node2){
        var tol = 0.0001;
        return Math.abs(node1.lat()-node2.lat()) < tol && Math.abs(node1.lng()-node2.lng()) < tol;
    }

   var MapSegmentModel = Backbone.Model.extend({
        defaults:{
            selected:false
        }
        , initialize:function () {
            _.bindAll(this, 'segselect', 'drawpath');
            this.drawpath();
            var that = this;
            google.maps.event.addListener(this.get('polyline'), 'click', this.segselect);
            google.maps.event.addListener(this.get('polyline'), 'mouseover', function() {
                if (!that.get('selected')){
                    this.setOptions({strokeColor: '#e3cf7a'})
                }
            });
            google.maps.event.addListener(this.get('polyline'), 'mouseout', function() {
                if (!that.get('selected')){
                    this.setOptions({strokeColor: '#004CFF'})
                }
            })
        }
        , segselect:function () {
            if (this.get("selected") == true) {
                this.set("selected", false);
            }
            else {
                this.set('selected', true);
            }
        }
        , drawpath:function () {
            this.set('path', _.map(this.get('geometry').coordinates, function(point){
                return new google.maps.LatLng(point[1], point[0]) })
                );
            var polyOptions = {
                path:this.get('path'),
                strokeColor:'#004CFF',
                strokeOpacity:1.0,
                strokeWeight:5
            };
            this.set('polyline', new google.maps.Polyline(polyOptions));
            var that = this;
            google.maps.event.addListener(this.get('polyline'), 'click', function(){
                console.log(that.get('properties').id)
            })
        }
    });

    return Backbone.Collection.extend({
        url:"/api/segments/bounds"
        , model:MapSegmentModel
        , selected : []
        , initialize:function () {
            this.on('change:selected', function (model) {
                if (!model.get('selected')) {
                    model.get("polyline").setOptions({strokeColor:'#004CFF'});
                    this.selected = _.without(this.selected, model)
                }
                if (model.get('selected')) {
                    if (this.selected.length >= 1) {
                        var continuous = _.any(this.selected, function (seg) {
                            var node1 = _.first(seg.get('path'));
                            var node2 = _.last(seg.get('path'));
                            var node3 = _.first(model.get('path'));
                            var node4 = _.last(model.get('path'));
                            return compare(node4, node1) || compare(node3, node1) || compare(node4, node2) || compare(node3, node2)
                        });

                        if (continuous) {
                            model.get("polyline").setOptions({strokeColor:'#FF0000'});
                            this.selected.push(model)
                            }
                        else {
                            model.set('selected', false);
                            this.trigger('continuous');
                        }
                    }
                    else {
                        model.get("polyline").setOptions({strokeColor:'#FF0000'});
                        this.selected.push(model)
                    }
                }

            });
            this.on('sync', function(){
                this.selected = []
            }, this)
        }
        , parse : function(resp){
            return resp.features;
        }
    });
});