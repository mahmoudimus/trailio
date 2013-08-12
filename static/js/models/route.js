/**
 * Created with PyCharm.
 * User: peterfrance
 * Date: 2/6/13
 * Time: 12:20 PM
 * To change this template use File | Settings | File Templates.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'models/routesegmentmodel',
    'models/picture',
    'models/sectionmodel',
    'globals'
], function($, _, Backbone, RouteSegmentModel, Picture, SectionModel, Globals){


    var RouteData = Backbone.Collection.extend({
        model: RouteSegmentModel,
        defaults: {
            reverse:false
        }
    });

    var Pictures = Backbone.Collection.extend({
        model:Picture
    });
    return Backbone.Model.extend({
        urlRoot: '/_json/r',
        section_length: 3500,
        initialize: function() {
            _.bindAll(this, 'prepare');
            if (Globals.route && Globals.route.path == location.pathname) {
				this.set({
					info: new Backbone.Model(Globals.route.info),
					route_data: new RouteData(Globals.route.route_data),
					pictures:new Pictures(Globals.route.pictures),
					path: Globals.route.path,
                    distance: Globals.route.distance,
                    elevations: Globals.route.elevations,
                    name:Globals.route.name,
                    el_intact:Globals.route.el_intact
				});
				this.prepare();
        	} else {
                this.fetch();
                this.on('sync', this.prepare)
        	}
        },

        parse: function(response){
            return {
                info: new Backbone.Model(response.info),
                name: response.name,
                route_data: new RouteData(response.route_data),
                pictures:new Pictures(response.pictures),
                path: response.path,
                distance: response.distance,
                elevations: response.elevations,
                el_intact:response.el_intact
            }
        },
        prepare: function() {
            var section_bounds = new google.maps.LatLngBounds();
            var section_elevations = [],
                section_coordinates = [];
            var section_length = 0,
                elindex = 0;

            this.set('sections', new Backbone.Collection);

            this.get('route_data').each(function(seg){
                _.each(seg.get('polyline').getPath().getArray(), function(point, j, coordinates){
                    section_coordinates.push(point);
                    section_bounds.extend(point);

                    if (j>0) section_length += google.maps.geometry.spherical.computeDistanceBetween(coordinates[j], coordinates[j-1]);
                    if (section_length > this.section_length){
                        var oldindex = elindex;
                        elindex = Math.round(seg.get('elevations').length*j/coordinates.length);
                        if (section_elevations.length>0){
                            section_elevations = section_elevations.concat(seg.get('elevations').slice(oldindex, elindex+1))
                        }else {
                            section_elevations = seg.get('elevations').slice(oldindex, elindex+1);
                        }
                        var model = new SectionModel({
                            querybounds:section_bounds,
                            distance:section_length/1000,
                            coordinates: section_coordinates,
                            elevations: section_elevations,
                            journal:_.filter(this.get('pictures').models, function(model){
                                return section_bounds.contains(model.get('latlng'))
                            })
                        });
                        this.get('sections').add(model);
                        section_length = 0;
                        section_bounds = new google.maps.LatLngBounds();
                        section_coordinates = [];
                        section_elevations = [];
                    }
                },this);
                if (section_elevations.length>0){
                    section_elevations = section_elevations.concat(seg.get('elevations').slice(elindex))
                }else {
                    section_elevations = seg.get('elevations').slice(elindex);
                }
                elindex = 0

            }, this);
        },

        reverse: function(){
            this.get('route_data').models.reverse();
            this.get('route_data').each(function(model){
                model.get('elevations').reverse();
                model.get('coords').reverse();
                model.set('reverse', !model.get('reverse'));
            });
            this.get('elevations').reverse();
            this.set('reverse', !this.get('reverse'));
        }
    });
});