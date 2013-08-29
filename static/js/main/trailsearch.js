define([
    'jquery',
    'underscore',
    'backbone',
    'typeahead'

], function ($, _, Backbone) {
    return Backbone.View.extend({
          el : "#trail_search"
        , initialize: function() {
            var collection = new Backbone.Collection();
            collection.parse = function(resp){return resp.features};
            this.$el.find("input").typeahead({
                source: function(query, process) {

                    collection.url = '/api/named_route/?search=' + query;
                    collection.fetch({
                        success: function(coll){
                            process(_.pluck(coll.pluck('properties'), 'name'));
                        }
                    });
                }
                , updater : function(item){
                    window.location.href = window.location.origin + "/named_route/" + item.split(' ').join('_');
                }
            });
        }
    });
});
