define([
    'main/globals',
    'jquery',
    'underscore',
    'backbone',
    'front/mapsearchview',
    'front/mapsearchlist',
    'front/regionSearch',
    'templates/templates',
    'utils',
    'libs/spin',
    'async!http://maps.googleapis.com/maps/api/js?key=AIzaSyCn0mXVcSCWexEo-VAxdghkyCKVw8HKUOs&libraries=geometry,places&sensor=true'

], function(Globals, $, _, Backbone, MapSearchView, MapSearchList, RegionSearch,Templates, Utils){


    var ClassicTrails = Backbone.Collection.extend({
          model: Backbone.Model
        , url: '/api/named_route/'
    });

    return Backbone.View.extend({
        el:'#main'
        , page: 1
        , length:10
        , classic_temp : '<% _.each(models, function(model) { %> <li class="media"><a class="pull-left"><img class="media-object img-polaroid" src="<%=model.get("photo")%>"></a><div class="media-body"><a href="<%=model.get("path")%>"><h4 class="media-heading"><%=model.get("name")%></h4></a><%=model.get("region")%></div></li> <% }); %>'
        , events: {
            'click #cl_previous': 'startprevious',
            'click #cl_next':       'startnext',
            'click #ref-map'    : 'refresh',
            'click #show-trail' : 'showtrail'
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
            this.$('#classic_list').show("slide",{}, 500);
        }
        , fill : function(direction, spinner) {
            var $list = this.$('#classic_list');
            $list.empty();
            this.page += direction;
            var endindex = this.page*this.length;
            var lists = _.template(Templates.classic_rows, {models:this.classic_routes.models.slice(endindex-this.length, endindex)});
            $list.html(lists);
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
                    console.log(resp)
                    location.href = resp.path
                }
            });
        }

        , render: function () {
            this.mapview = new MapSearchView({collection: this.maplist});
            this.regionsearch = new RegionSearch({map : this.mapview.map});

            return this
        }

        , refresh:function () {
            var that = this;
            this.mapview.clearlines();
            var spinner = new Spinner().spin(this.$('#map_canvas')[0]);
            var bounds = this.mapview.map.getBounds();
            var zoom = this.mapview.map.getZoom();
            var index = 0,
                time = 6000;
            var updatemessage = function() {
                var texts = ['Sorry it\'s taking so long. It will be quicker next time. Promise.',
                                'Hang in there. It will load shortly.',
                                'Not sure what\'s taking so long...'];
                that.$('#map_canvas').append(Templates.load_coming({text:texts[index]}));
                that.$('.alert-info').css({
                    'position':'absolute',
                    'right':    '0px'
                }).delay(2000).fadeOut(400);
                index +=1;
                time *= 2;
                timeout = setTimeout(updatemessage, time)
            };
            var timeout = setTimeout(updatemessage, time);
            var loadbutton = this.$('#ref-map').button('loading');

            this.maplist.fetch({
                data:{
                    north:bounds.getNorthEast().lat(),
                    south:bounds.getSouthWest().lat(),
                    east:bounds.getNorthEast().lng(),
                    west:bounds.getSouthWest().lng(),
                    type:'bbox',
                    zoom:zoom
                },
                reset: true,
                complete:function () {
                    clearTimeout(timeout);
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
            var that = this;
            var $list = this.$('#classic_list');
            $list.animate({
                scrollTop: this.$el.offset().top
            }, 100);
            var spinner = new Spinner().spin($list[0]);
            var new_range = _.range((this.page*this.length), (this.page*this.length)+this.length);

            this.classic_routes.once('sync', function(){
                $list.hide('slide', {}, 500, function() {
                    if (that.classic_routes.at(new_range[0])){
                        that.fill(1, spinner);
                    } else {that.reload(spinner)}
                });
            }, this);

            if (!this.classic_routes.at(new_range[0])){
                this.classic_routes.fetch({
                    data: {page:this.page+1, length:this.length},
                    update:true,
                    remove:false
                });
            } else {
                $list.hide('slide', {},500, function() {
                    that.fill(1, spinner)
                });
            }
        }

        , startprevious: function() {
            var that = this;
            var $list = this.$('#classic_list');
            $list.animate({
                scrollTop: this.$el.offset().top
            }, 100);
            if (this.page>=2){
                $list.hide('slide', {},500, function() {
                    that.fill( -1);
                });
            }
        }
    });

});

