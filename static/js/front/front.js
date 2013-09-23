define([
      'main/globals'
    , 'jquery'
    , 'underscore'
    , 'backbone'
    , 'handlebars'
    , 'front/mapsearchview'
    , 'front/mapsearchlist'
    , 'front/regionSearch'
    , 'utils'
    , 'tour'
    , 'text!templates/classic_trails.html'
    , 'libs/spin'
    , 'async!http://maps.googleapis.com/maps/api/js?key=AIzaSyCn0mXVcSCWexEo-VAxdghkyCKVw8HKUOs&libraries=geometry,places&sensor=true'

], function(Globals, $, _, Backbone, Handlebars,MapSearchView, MapSearchList, RegionSearch,Utils, Tour, ClassicItemTemp){


    var ClassicTrails = Backbone.Collection.extend({
          model: Backbone.Model
        , url: '/api/named_route/'
    });

    return Backbone.View.extend({
        el:'#main'
        , page: 1
        , length : 10
        , events : {
              'click #cl_previous': 'startprevious'
            , 'click #cl_next':       'startnext'
            , 'click #ref-map'    : 'refresh'
            , 'click #show-trail' : 'showtrail'
        }

        , initialize : function () {
            _.bindAll(this);

            this.maplist = new MapSearchList;
            this.classic_routes = new ClassicTrails(Globals.classic_routes);
            this.render();
        }

        , reload : function(spinner){
            if (typeof spinner != 'undefined'){
                spinner.stop();
            }
            this.$('#classic_list').show(500);
        }
        , fill : function(direction, spinner) {
            var $list = this.$('#classic_list');
            $list.empty();
            this.page += direction;
            var endindex = this.page * this.length;
            var list_temp = Handlebars.compile(ClassicItemTemp);
            var html = list_temp({models:this.classic_routes.models.slice(endindex-this.length, endindex)})
            $list.html(html);
            this.reload(spinner);
        }

        , showtrail : function(){
            var selected = _.map(this.maplist.selected, function(model){
                return model.get('properties').id
            });
            $.ajax({
                url : '/api/route/',
                data : {
                    selected : selected.join('+')
                },
                type : 'POST',
                success : function(resp){
                    location.href = resp.path
                }
            });
        }

        , render: function () {
            this.mapview = new MapSearchView({collection: this.maplist});
            this.regionsearch = new RegionSearch({map : this.mapview.map});
            this.tour = new Tour();

            return this
        }

        , refresh:function () {
            this.mapview.clearlines();
            var spinner = new Spinner().spin(this.$('#map_canvas')[0]);
            var bounds = this.mapview.map.getBounds();
            var zoom = this.mapview.map.getZoom();
            var loadbutton = this.$('#ref-map').button('loading');

            this.maplist.fetch({
                data:{
                     north : bounds.getNorthEast().lat()
                    , south : bounds.getSouthWest().lat()
                    , east : bounds.getNorthEast().lng()
                    , west : bounds.getSouthWest().lng()
                    , type : 'bbox'
                    , zoom : zoom
                },
                reset: true,
                complete:function () {
                    loadbutton.button('reset');
                    spinner.stop()
                }
            });
            Utils.SetLocation(bounds.getCenter());
        }

        , close:function () {
            this.tour.close();
            this.remove();
            this.unbind();
        }

        , startnext: function() {
//            var that = this;
            var $list = this.$('#classic_list');
            var fill = this.fill,
                reload = this.reload;
            $list.animate({
                scrollTop: this.$el.offset().top
            }, 100);
            var spinner = new Spinner().spin($list[0]);
            var new_range = _.range((this.page * this.length), (this.page * this.length) + this.length);

            this.classic_routes.once('sync', function(coll, resp, options){
                $list.hide(500, function() {
                    if (coll.at(new_range[0])){
                        fill(1, spinner);
                    } else {reload(spinner)}
                });
            }, this);

            if (!this.classic_routes.at(new_range[0])){
                this.classic_routes.fetch({
                    data: {  page : this.page + 1
                           , length:this.length
                    }
                    , update:true
                    , remove:false
                });
            } else {
                $list.hide(500, function() {
                    fill(1, spinner)
                });
            }
        }

        , startprevious: function() {
            var fill = this.fill;
            var $list = this.$('#classic_list');
            $list.animate({
                scrollTop: this.$el.offset().top
            }, 100);
            if (this.page >= 2){
                $list.hide(500, function() {
                    fill( -1);
                });
            }
        }
    });

});

