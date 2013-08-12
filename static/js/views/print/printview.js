/**
 * Created with PyCharm.
 * User: peterfrance
 * Date: 10/3/12
 * Time: 10:26 AM
 * To change this template use File | Settings | File Templates.
 */

define([
    'jquery',
    'underscore',
    'backbone',
    'templates/templates',
    'views/print/printmapview',
    'views/route/elevationview'
], function($, _, Backbone, Templates, PrintMapView, ElevationView){

    return Backbone.View.extend({
        id: 'print_content',

        initialize: function() {
            _.bindAll(this);
            this.on('ready', this.loaditems);
            this.render();
            this.loadmodal();
        },
        is_metric: true,

        loaditems: function() {
            var pagenum = 0;
            this.collection.each(function(){
                pagenum += 1;
                var page = Templates.print_page({page:pagenum});
                this.$el.append(page);
            }, this);
            var that = this;
//            cycle through newly created pages, adding views
//            this.collection.models.reverse();
            this.$el.find('.page').each(function(i){
                var section = that.collection.at(i);
                section.on('sync', function(){
                    spinner.stop()
                });
                var bounds = section.get('querybounds');
                var map = new PrintMapView({id:'map_canvas'+i, model:section, bounds:bounds});
                $(this).append(map.el);
                map.drawmarkers();
                google.maps.event.trigger(map.map, 'resize');
                map.map.fitBounds(bounds);
                map.settopo();
                var attributes = {style:'width:372px;height:400px;float:right'};
                var elevation_view = new ElevationView({model:section, id:'elevation'+i, parent:that, attributes:attributes}).render();
                $(this).append(elevation_view.el);
                var spinner = new Spinner().spin($(this)[0]);
                if (section.get('journal').length > 0){
                    var entry = section.get('journal')[0];
                    $(this).append(Templates.print_photo({url:entry.get('images').thumbnail, text:entry.get('text'), imgwidth:width.toString(), width:width.toString() + 'px'}))
                }
                $(this).append('<div class="page-break"></div>')
            });
        },

        loadmodal: function() {
            var $content = $('#print-modal-content');
            var frame = $content[0].contentWindow.document;
            frame.open();
            frame.write('<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
                '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">' +
                '<head><title>' + document.title + '</title>' +
                '</head>' +
                '<body></body>' +
                '</html>');
            frame.close();
            var $iframe_head = $('head link[media*=print], head link[media=all]').clone();
            $iframe_head.each(function() {
                $(this).attr('media', 'all');
            });
            $('head', frame).append($iframe_head.clone());
            $('body', frame).append(this.$el);
            var $framewindow = $content[0].contentWindow;
            var $print_modal = $('#print-modal');
            var $modal_controls = $('#print-modal-controls');
            var starting_position = $(window).height() + $(window).scrollTop();
            var css = {
                top:         starting_position,
                height:      '100%',
                zIndex:      10000,
                display:     'block'
            };
            var that = this;
            $print_modal
                .css(css)
                .animate({ top:$(window).scrollTop() }, 400, 'linear', function() {
                    $modal_controls.fadeIn('slow').focus();
                    that.trigger('ready');

                });

            $('a', $modal_controls).on('click', function(e) {
                e.preventDefault();
                if ($(this).hasClass('print')) { $framewindow.print(); }
                else { that.distroyPrintPreview(); }
            });
        },
        render: function() {
            $('body').append(Templates.print_modal());
        },

        distroyPrintPreview: function() {
            $('#print-modal-controls').fadeOut(100);
            $('#print-modal').animate({ top: $(window).scrollTop() - $(window).height(), opacity: 1}, 400, 'linear', function(){
                $('#print-modal').remove();
            });
        }
    });
});



