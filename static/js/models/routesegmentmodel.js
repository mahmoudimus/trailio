// Use this as a quick template for future modules
define([
    'jquery',
    'underscore',
    'backbone',
    'models/segmentmodel'
], function($, _, Backbone, SegmentModel){
    return SegmentModel.extend({
        initialize:function () {
            _.bindAll(this);
            this.drawpath();
        }
    });
});
