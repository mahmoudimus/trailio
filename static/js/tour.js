define([
    'jquery',
    'underscore',
    'backbone',
    'intro'
//    'templates/templates'
], function ($, _, Backbone, IntroJS) {

    return Backbone.View.extend({
        el: '#intro_tour',
        events: {
            'click #tour_button': 'start'
        },
        template : _.template(''),
        initialize: function() {
            console.log('init')
//            this.delegateEvents(this.events)
        },

        start: function() {
            console.log(IntroJS)
            IntroJS().start()
        },

        close: function(){
            this.$el.empty();
//            this.remove();
            this.unbind();
        }
    });
});
