define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/typeahead-menu.html'
], function ($, _, Backbone, TypeaheadMenu) {

    return Backbone.View.extend({
          el: "#trail_search_box"
        , events : {
            "keypress"  : "refresh"

        }

        , initialize: function() {
            this.collection = new Backbone.Collection();
            this.collection.parse = function(resp){return resp.features};

        }
        , refresh : function (e) {
            var query = e.something;
            this.collection.url = '/api/named_route/?search=' + query;
            this.listenTo(this.collection, 'sync', function (coll) {
                var name = _.pluck(coll.pluck('properties'), 'name');
                window.location.href = window.location.origin + "/named_route/" + name.split(' ').join('_')

            });
            this.collection.fetch();

        }
        , process : function (item) {


        }
//            this.$el.typeahead({
//                source: function(query, process) {
//                    collection.url = '/api/named_route/?search=' + query;
//                    collection.fetch({
//                        success: function(coll){
//                            process(_.pluck(coll.pluck('properties'), 'name'));
//                        }
//                    });
//                }
//                , updater : function(item){
//                    window.location.href = window.location.origin + "/named_route/" + item.split(' ').join('_');
//                }
//            });

    });
});
