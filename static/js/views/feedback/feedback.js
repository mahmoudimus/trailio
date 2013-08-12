define([
    'jquery',
    'underscore',
    'backbone',
    'templates/templates',
    'backbone-forms'

], function ($, _, Backbone, Templates) {
    var RouteCollection = Backbone.Collection.extend({
        url:'/json/userroutes',
        model: Backbone.Model.extend({
            initialize: function(){
                _.bindAll(this);
                this.id = this.get('path')
            },
            toString: function(){
                return this.get('path')
            }
        })
    });
    var rcollection = new RouteCollection;
    var FormModel = Backbone.Model.extend({
        url: '/feedback',
        schema: {
            name: {validators: ['required'],type:'Text',template:'form_item'},
            email: { validators: ['required', 'email'],  fieldAttrs:{"required":true}, template:'form_item'},
            subject: {validators: ['required'],type:'Select', options:['Report an Error','Information Request','Feature Suggestion', 'Report an Inaccuracy'], template:'form_item'},
            route: {type:'Select',options:rcollection,template:'form_item'},
            message: {validators: ['required'],type:'TextArea', editorClass: 'span8', template:'form_item', editorAttrs:{rows:"8"}}

        }
    });

    var formmodel = new FormModel;
    Backbone.Form.setTemplates(Templates.form_templates,
        {error:'error'}
    );
    var form = new Backbone.Form({
        model:formmodel
    });
    return Backbone.View.extend({
        id:'main',
        initialize: function() {
            _.bindAll(this);
        },
        events: {
            'click button#submit': 'submit'
        },
        render: function() {
            var el = form.render().el;
            $(el).find('ul').append(Templates.form_templates.form_button);
            this.$el.html(el);
            form.fields['route'].$el.hide();
            return this

        },
        onShow: function() {
            this.delegateEvents(this.events);
            $('body,html').animate({
                scrollTop: $("body").offset().top
            }, 2000);
            form.on('subject:change', function(form, subjecteditor){
                var subject = subjecteditor.getValue();
                if (subject=='Report an Inaccuracy'){
                    form.fields['route'].$el.show(200);
                } else{
                    form.fields['route'].$el.hide(200);
                }
            });
        },
        submit: function() {
            var errors = form.commit();
            if (_.isUndefined(errors)){
                formmodel.save()
            }
        }
    });
});
