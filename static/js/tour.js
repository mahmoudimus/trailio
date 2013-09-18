define([
    'jquery',
    'underscore',
    'backbone',
    'intro'
], function ($, _, Backbone, IntroJS) {

    return Backbone.View.extend({
        el: '#intro_tour',
        events: {
            'click #tour_button': 'start'
        },
        template : _.template(''),
        start: function() {
            IntroJS().start()
        },
        close: function(){
            this.$el.empty();
            this.unbind();
        }
    });
});
