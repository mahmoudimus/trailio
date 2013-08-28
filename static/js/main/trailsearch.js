define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/typeahead-menu.html'
], function ($, _, Backbone, TypeaheadMenu) {

    return Backbone.View.extend({
        suppressKeyPressRepeat: false
        , el: "#trail_search"
        , events: {
              "keypress": "keypress"
            , "blur": "blur"
            , "keyup": "keyup"
        }
        , move: function (e) {
            console.log(e)
            if (!this.shown) return;

            switch (e.keyCode) {
                case 9: // tab
                case 13: // enter
                case 27: // escape
                    e.preventDefault();
                    break;

                case 38: // up arrow
                    e.preventDefault();
                    this.prev();
                    break;

                case 40: // down arrow
                    e.preventDefault();
                    this.next();
                    break
            }

            e.stopPropagation();
        }
        , keypress: function (e) {
            if (this.suppressKeyPressRepeat) return;
            this.move(e)
        }
        , keyup: function (e) {
            switch (e.keyCode) {
                case 40: // down arrow
                case 38: // up arrow
                    break

                case 9: // tab
                case 13: // enter
                    if (!this.shown) return
//                    this.select()
                    break

                case 27: // escape
                    if (!this.shown) return
//                    this.hide()
                    break

                default:
                    this.lookup(e);
            }

            e.stopPropagation();
            e.preventDefault()
        }
        , lookup: function (event) {
            this.query = this.$el.find('input').val();
            var items;
            var process = function (coll) {
                items = _.pluck(coll.pluck('properties'), 'name');
            }
            this.collection.url = '/api/named_route/?search=' + query;
            this.collection.fetch({
                success: process
            });


        }
        , initialize: function () {
            this.collection = new Backbone.Collection();
            this.collection.parse = function (resp) {
                return resp.features
            };

        }
        , refresh: function (e) {
            var query = e.something;
            this.collection.url = '/api/named_route/?search=' + query;
            this.listenTo(this.collection, 'sync', function (coll) {
                var name = _.pluck(coll.pluck('properties'), 'name');
                window.location.href = window.location.origin + "/named_route/" + name.split(' ').join('_')

            });
            this.collection.fetch();

        }
    });
});
