requirejs.config({
    paths: {
        "jquery": "../libs/jquery/jquery-1.9.1.min",
        "underscore": "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min",
        "backbone": "https://cdnjs.cloudflare.com/ajax/libs/backbone.js/1.0.0/backbone-min"
    },

    shim: {
        "underscore": {
            exports: "_"
        },
        "backbone": {
            "deps": ["underscore", "jquery"],
            "exports": "Backbone"
        }
    }
});

define('editor',[
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {

    var SegModel = Backbone.Model.extend({
        initialize: function(){
            _.bindAll(this);
            this.add_polyline()
        },
        add_polyline: function(){
            var coords = this.get('geometry').coordinates;
            var cp = new google.maps.LatLng(coords[0][1], coords[0][0]);
            this.set('bounds', new google.maps.LatLngBounds(cp, cp));
            var polyarray = [];
//            this.set('polyarray', []);
            _.each(coords, function(point){
                var lat = point[1], lon = point[0];
                var latlng = new google.maps.LatLng(lat, lon);
                polyarray.push(latlng)
            }, this);
            var polyOptions = {
                strokeColor:'#FF0000',
                strokeOpacity:1.0,
                strokeWeight:3,
                editable: false
            };
            if (this.get('properties').length < 200){
                polyOptions.strokeColor = '#FF52E5'
            }
            this.set('poly', new google.maps.Polyline(polyOptions));
            this.get('poly').setPath(polyarray);
        },
        set_listener : function() {
            var that = this;
            var listener = google.maps.event.addListener(this.get('poly'), 'click', function(){
                if (_.contains(selected.models, that)){
                    selected.remove(that);
                    that.get('poly').setOptions({strokeColor:'#FF0000'})
                } else {
                    selected.add(that);
                    that.get('poly').setOptions({strokeColor:'#004CFF'})
                }
            });
            this.set('listener', listener)
        },
        set_edit_listener : function() {
            var that = this;
            var listener = google.maps.event.addListener(this.get('poly'), 'click', function(e){
                var index = e.vertex;
                that.get('poly').getPath().removeAt(index)
            });
            this.set('edit_listener', listener)
        },
        remove_listener: function() {
            google.maps.event.removeListener(this.get('listener'))
        },
        remove_edit_listener: function() {
            google.maps.event.removeListener(this.get('edit_listener'))
        }
    });

    var SegArray = Backbone.Collection.extend({
        model:SegModel,
        initialize: function(){
            _.bindAll(this, 'url')
        },
        url: function(){
            return '/api/segments/trail_name/' + this.trail_name
        },
        parse : function(response){
            return response.features
        }
        });

    var Selected = Backbone.Collection.extend({
        initialize: function() {
            _.bindAll(this);
        },
        clear : function(){
            this.each(function(model){
                model.get('poly').setOptions({strokeColor:'#FF0000'})
            });
            this.reset()
        }
    });

    var seg_array = new SegArray;

    var selected = new Selected;

    return Backbone.View.extend({
        el: 'body',
        events: {
            'click #clear':         "clear",
            'click #select_all':    "select",
            'click #query':         "query",
            'click #submit':        "submit",
            'click #edit'   :       "edit",
            'click #submit_seg':    "submitseg",
            'click #delete'     :   "del_seg",
            'click #connect'    :   "connect"
        },
        initialize: function(){
            _.bindAll(this);
            this.render()
        },
        render: function() {
            var mapOptions = {
                center: new google.maps.LatLng(36, -118),
                mapTypeId:google.maps.MapTypeId.TERRAIN,
                zoom:12
            };
            this.map = new google.maps.Map(document.getElementById('map_canvas'), mapOptions);
            selected.on('all', function() {
                this.$('#seg_id').html(selected.pluck('id').join(' '))
            }, this);
            seg_array.on('reset', function() {
                var cp = seg_array.at(0).get('bounds').getCenter();
//                var cp = new google.maps.LatLng(seg_array.at(0).get('bounds').getCenter(), seg_array.at(0).get('bounds').getCenter());;
                var bounds = new google.maps.LatLngBounds(cp, cp);
                seg_array.each(function(model){
                    bounds.union(model.get('bounds'));
                    model.get('poly').setMap(this.map);
                    model.set_listener();
                }, this);
                this.map.fitBounds(bounds)
            }, this);

        },
        clear : function(){
            selected.clear()
        },
        select: function(){
            seg_array.each(function(model){
                selected.add(model);
                model.get('poly').setOptions({strokeColor:'#004CFF'})
            })
        },
        query : function() {
            seg_array.trail_name = this.$("#trail_name").val()
            seg_array.fetch({
                reset: true
            })
        },
        submit : function() {
            var name = this.$("#trail_name").val();
            console.log(selected.models);
            $.ajax({
                url: '/api/named_route/' + name,
                type: 'POST',
                data: {
                    segs: _.pluck(selected.pluck('properties'), 'id').join('+'),
//                    selected.pluck('id').join('+'),
                    trail: name,
                    link: this.$("#links").val()
                },
                success: function() {
                    selected.reset()
                }
            })
        },
        edit : function() {
            var seg = selected.at(0);
            if (seg.get('poly').getEditable()){
                seg.set_listener();
                seg.remove_edit_listener();
                seg.get('poly').setOptions({editable:false})
            } else {
                seg.remove_listener();
                seg.set_edit_listener();
                seg.get('poly').setOptions({editable:true})
            }
        },
        submitseg: function() {
            var seg = selected.at(0);
            var coords = seg.get('poly').getPath().getArray();
            coords = _.map(coords, function(point){
                return point.toString()
            });
            var string = coords.join('|');
            $.ajax({
                url: '/admin/_json/segedit',
                type: 'POST',
                data: {
                    sid: seg.get('id'),
                    coords: string
                }
            })
        },
        del_seg : function(){
            $.ajax({
                url: '/admin/_json/delete',
                type: 'POST',
                data: {
                    segs: selected.pluck('sid').join('+')
                },
                success: function() {
                    selected.each(function(model){
                        model.get('poly').setMap(null)
                    });
                    seg_array.remove(selected.models);
                    selected.reset()
                }
            })
        },
        connect : function() {
            var that = this;
            $.ajax({
                url: '/admin/_json/connect',
                type: 'POST',
                data: {
                    segs: selected.pluck('id').join('+')
                },
                success: function(data) {
                    selected.each(function(model){
                        model.get('poly').setMap(null)
                    });
                    seg_array.remove(selected.models);
                    var model = new SegModel(data);
                    model.get('poly').setMap(that.map);
//                    model.set_listener();
                    seg_array.add(model);
                    selected.reset()
                }
            })
        }
    });
});

require(['editor'], function(Editor){
    new Editor();
});
