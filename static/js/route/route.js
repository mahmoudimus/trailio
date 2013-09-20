define([

      'jquery'
    , 'underscore'
    , 'backbone'
    , 'handlebars'
    , 'libs/domReady'
    , 'main/globals'
    , 'route/routemapview'
    , 'route/uploadimage'
    , 'route/elevationview'
    , 'text!templates/image_item.html'
    , 'bootstrap'
    , 'utils'
    , 'libs/spin'

], function ($, _, Backbone, Handlebars, domReady, Globals, RouteMapView, UploadImage, ElevationView, ImageItem) {

    var icon = {
          path : google.maps.SymbolPath.CIRCLE
        , scale : 5
        , fillOpacity : 1
        , strokeWeight : 0
    };

    var Route = Backbone.Model.extend({

        initialize :function () {
            var path =  _.map(this.get('geometry').coordinates, function(point){
                return new google.maps.LatLng(point[1], point[0])
                });
            this.set('start', new google.maps.Marker({
                position : path[0]
                , icon : _.extend({fillColor : 'green'}, icon)
            }));
            this.set('end', new google.maps.Marker({
                position : _.last(path)
                , icon : _.extend({fillColor : 'red'}, icon)
            }));

            this.set('polyline', new google.maps.Polyline({
                path: path,
                strokeColor:'#004CFF',
                strokeOpacity:1.0,
                strokeWeight:5
            }));
            this.set('metric', true);
        }
        , reverse : function() {
            var start = this.get('start').getPosition();
            var end = this.get("end").getPosition();
            this.get('start').setPosition(end);
            this.get('end').setPosition(start);
            this.get('properties').elevations.reverse();
        }

    });
    return  Backbone.View.extend({
          el:'#main'
        , currentView : null
        , initialize : function () {
            _.bindAll(this);
            var that = this;
            domReady(function(){
                that.route = new Route(Globals);
                that.photos = new Backbone.Collection(that.route.get('properties').photos);
                that.render();
            });
        }

        , change_view : function(newview){
            var el = this.$('.tab-content');
            if (this.currentView){
                this.currentView.close();
            }
            this.currentView = newview.render();
            el.html(this.currentView.el);
        }

        , events: {
            "click #view_map":  "show_map_view",
            "click #view_photo": "upload_photo_view",
            "click #view_elevation": "elevation_view",
            "click #save_route":      "save_route",
            "click .nav-pills" : "deactivate",
            'click .metric': 'change_units',
            'click .rating .star': 'vote',
            'slid .carousel' : 'rotate_photo',

            'mouseenter #carousel': function(){
                this.$('.carousel-control').fadeIn(100);
                this.$('.carousel-caption').fadeIn(100)
            },
            'mouseleave #carousel': function() {
                this.$('.carousel-control').fadeOut(100);
                this.$('.carousel-caption').fadeOut(100);
            },
            'click .carousel-control' : function(e){
                var dir = e.toElement.attributes.getNamedItem('data-slide').nodeValue;
                this.$('.carousel').carousel(dir);
            }
        }

        , render:function () {

            this.show_map_view();
            this.listenTo(this.photos, 'add', function(model){
                var temp = Handlebars.compile(ImageItem);
                this.$('.carousel-inner').append(temp(model.attributes))
            }, this);

            return this
        }

        , rotate_photo: function(e){
            if (this.currentView.hasOwnProperty('set_photo_marker')){
                if (e){
                    var ind = this.$('.carousel-inner').find(".active", e.target).index();
                } else {
                    ind = 0
                }
                if (this.route.get('properties').photos.length > 0){
                    var point = this.route.get('properties').photos[ind].location.coordinates;
                    this.currentView.set_photo_marker(point)
                }
            }
        }

        , change_units : function() {
            var $value = this.$('#dis_val');
            var $unit = this.$('#dis_unit');
            if (this.route.get('metric')){
//                change to imperial
                $value.html(parseInt(this.route.get('properties').distance * 0.000621371));
                $unit.html('Miles')
            } else {
                $value.html(parseInt(this.route.get('properties').distance / 1000));
                $unit.html('Kilometers')
            }
            this.route.set('metric', !this.route.get('metric'));
            this.route.trigger('metric');
//            this.route.get('metric') = !this.route.get('metric');
        }
        , close : function () {
            this.remove();
            this.unbind();
        }

        , show_map_view : function() {
            this.$el.find('.nav-pills li').removeClass('active')
            this.$('#view_map').addClass('active');
            this.change_view(new RouteMapView({model:this.route}));
            this.currentView.drawmap();
            this.rotate_photo();
        }

        , elevation_view:function () {
            this.$el.find('.nav-pills li').removeClass('active')
            this.$('#view_elevation').addClass('active');
            var tab_content = this.$('.tab-content');
            var width = tab_content.width();
            var height = tab_content.height();
            var attributes = {
                style : "width:" + width + "px;height:" + height + "px"
            };
            this.change_view(new ElevationView({model : this.route, attributes: attributes}));
        }


        , upload_photo_view:function () {
            this.$el.find('.nav-pills li').removeClass('active')
            this.$('#view_photo').addClass('active');
            var view = new UploadImage({collection: this.photos});
            this.change_view(view);
            view.init_upload();
        }

        , save_route: function() {
            var selector = this.$('#save_route');
            var rid = this.route.get('properties').id;
            $.ajax({
                 url: '/api/vote/route/' + rid
                , type: 'post'
                , complete: function (xhr, status) {
                    if (xhr.status == 200 || xhr.status == 403) {
                        selector.find('.alert').addClass('marked alert-success');
                    } else {
                        selector.find('.alert').addClass('alert-danger disabled');
                    }
                }
            });
        }


        , vote: function(e){
            var ind = this.$('.carousel-inner').find(".active").index();
            var photo = this.photos.at(ind);
            var that = this;
            var $tar = $(e.currentTarget);
            $.ajax({
                url: '/api/vote/photo/' + photo.get('id').toString(),
                type: 'post',

                success: function() {
                    $tar.addClass('voted')
                },

                statusCode: {
                    401: function(){
                        that.$el.append('<div class="alert alert-error"><span>You must sign in to vote</span></div>');
                        var $error = $('.alert-error');
                        $error.css({
                            'position':'absolute',
                            'margin-top':'-30px',
                            'right':    '0px'
                        });
                        $error.delay(2000).fadeOut(400);
                    }
                }
            });
        }
    });
});
