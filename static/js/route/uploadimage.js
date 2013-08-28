define([
    'jquery',
    'underscore',
    'backbone',
    "handlebars",
    'text!templates/image_upload_container.html',
    'libs/fileupload/jquery.fileupload',
    'libs/fileupload/jquery.fileupload-fp',
    'libs/fileupload/jquery.fileupload-ui',
    'libs/fileupload/jsjpegmeta',
    'jquery-ui'

], function($, _, Backbone, Handlebars, ImageUploadContainer){
    return Backbone.View.extend({

          initialize: function(){
            _.bindAll(this)
        }

        , render:function () {
//            var template = Handlebars.compile(ImageUploadContainer)
            this.$el.append(ImageUploadContainer);
            return this
        }

        , init_upload:function () {
            var that = this;
            var formData = [];
            var $fileupload = $('#fileupload');
            $fileupload.fileupload({
                url:'/api/photo/',
                maxFileSize:5000000,
                acceptFileTypes:/(\.|\/)(gif|jpe?g|png)$/i,
                formData: formData,
                process:[
                    {
                        action:'load',
                        fileTypes:/^image\/(gif|jpeg|png)$/,
                        maxFileSize:20000000 // 20MB
                    }
                    , {
                        action:'resize',
                        maxWidth:1440,
                        maxHeight:900
                    }
                    , {
                        action:'save'
                    }
                ]
            });

            $fileupload.on('fileuploadadd', function(e, data){

                var process_metadata = function(coords){
                    if (coords==null){
                        $('.files').find('.cancel')
                            .children().click();
                    } else
                        {
                        formData.push({name:'coords', value:coords});
                        that.texteditor(function(text){
                            formData.push({name:'text', value:text});
                            formData.push({name:'path', value:location.pathname.slice(1)});
                        }, data);
                    }
                };
                that.getmetadata(e, data, process_metadata);
            });

            $fileupload.on('fileuploaddone', function(e, data){
                that.collection.add(data.result, {remove:false});
            });
        }
        , getmetadata: function(e, data, callback){
            var filePart;
            var file   = data.originalFiles[0];
            if (file.slice) {
                filePart = file.slice(0, 131072);
            } else if (file.webkitSlice) {
                filePart = file.webkitSlice(0, 131072);
            } else if (file.mozSlice) {
                filePart = file.mozSlice(0, 131072);
            } else {
                filePart = file;
            }
            var Breader = new FileReader();
            Breader.onload = function () {
                var exif = new JpegMeta.JpegFile(Breader.result, file.name);
                if(exif.gps != undefined) {
                    var lat = (exif.gps.GPSLatitude.value[0].asFloat() + exif.gps.GPSLatitude.value[1].asFloat()/60 + exif.gps.GPSLatitude.value[2].asFloat()/3600) * (exif.gps.GPSLatitudeRef.value == "N" ? 1 : -1);
                    var lng = (exif.gps.GPSLongitude.value[0].asFloat() + exif.gps.GPSLongitude.value[1].asFloat()/60 + exif.gps.GPSLongitude.value[2].asFloat()/3600) * (exif.gps.GPSLongitudeRef.value == "E" ? 1 : -1);
                    callback(lat +',' + lng)
                } else {
                    var fileUploadButtonBar = $('.fileupload-buttonbar'),
                        filesList = $('.files');
                    filesList.find('.delete input:checked')
                        .siblings('button').click();
                    fileUploadButtonBar.find('.toggle')
                        .prop('checked', false);
                    callback(null)
                    }
            };

            Breader.readAsBinaryString(filePart)

        }

        , texteditor: function(callback, data){
            $('body').append(Templates.text_editor());
            var $editor = $('#text-editor');
            var process_input = function() {
                callback($('#editor-body').val());
                $editor.modal('hide');
                $editor.remove();
            };
            $editor.modal('show');
            $('#submit-text').on('click', process_input);
            $editor.one('click.dismiss keyup.dismiss', '[data-dismiss="modal"]',function(e){
                if (e.type=='click'||(e.type=='keyup' && e.which==13)){
                    $('.files').find('.cancel')
                        .children().click();
                }
            });
        }
        , close: function(){
            this.remove();
            this.unbind();
        }

    });
});


