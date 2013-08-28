define([

    'jquery',
    'underscore',
    'backbone',
    'globals',
    'templates/templates',
    'route/routemapview',
    'route/uploadimage',
    'route/elevationview',
    'bootstrap',
    'utils',
    'libs/spin'

], function ($, _, Backbone, Globals, Templates, RouteMapView, UploadImage, ElevationView) {


    var Route = Backbone.Model.extend({

        initialize :function () {
            var path =  _.map(this.get('geometry').coordinates, function(point){
                return new google.maps.LatLng(point[1], point[0])
                });
            this.set('polyline', new google.maps.Polyline({
                path: path,
                strokeColor:'#004CFF',
                strokeOpacity:1.0,
                strokeWeight:5
            }));
            this.set('metric', true);
        }

    });
    return  Backbone.View.extend({
//          supressMouseEvent : false

          el:'#main'
        , currentView : null
        , initialize : function () {
            _.bindAll(this);

            this.route = new Route(Globals);
            this.photos = new Backbone.Collection(this.route.get('properties').photos);
            this.render();

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
                this.$('.carousel').carousel(e.toElement.attributes.getNamedItem('data-slide').nodeValue);
            }
        }

        , render:function () {

            this.show_map_view();

//            $('#carousel').on('slide.bs.carousel', function (e) {
//                console.log(e)
//            })
            this.listenTo(this.photos, 'add', function(model){
                this.$('.carousel-inner').append(Templates.image_item(model.attributes))
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
                $value.html(parseInt(this.route.get('properties').distance * 0.621371));
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
            var that = this;
            $.ajax({
                url: '/api/vote/route/' + that.model.get('properties').id,
                type: 'post',
                complete: function (xhr, status) {
                    var data = xhr.responseText;
                    if (data.hasOwnProperty('type')) {
                        selector.addClass('disabled marked')
                    } else {
                        selector.wrap('<div class="alert alert-error" />');
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
                        that.$el.append(Templates.signin_error({'action':"vote."}));
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
