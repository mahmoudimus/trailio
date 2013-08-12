define([
    'jquery',
    'underscore',
    'backbone',
    'libs/introjs/intro',
    'templates/templates'
], function ($, _, Backbone, IntroJS, Templates) {

    return Backbone.View.extend({
        el: '#intro_tour',
        events: {
            'click #tour_button': 'start'
        },
        template : _.template(''),
        initialize: function() {
            this.delegateEvents(this.events)
        },

        render: function() {
            this.$el.html(Templates.front_tour());
            return this
        },
        start: function() {
            IntroJS().start()
        },

        close: function(){
            this.$el.empty();
//            this.remove();
            this.unbind();
        }
    });
});
