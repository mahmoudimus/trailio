define([
    'jquery',
    'underscore',
    'backbone',
    'globals'
], function ($, _, Backbone, Globals) {

    return  Backbone.Model.extend({
        urlRoot:'/_json/profile',
        initialize: function(){
            if (Globals.profile_rendered==true && this.id==Globals.profile_id){
                this.set(Globals.profile_string);
            } else {
                this.fetch();
            }
        }
    });
});
