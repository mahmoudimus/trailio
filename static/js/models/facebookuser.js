define([
    'jquery',
    'underscore',
    'backbone',
    'globals',
    'facebook',
    'gmaps'
], function($, _, Backbone, Globals, FB){

    FB.init({
        appId      : appid,
        channelUrl : '//'+window.location.hostname+'/channel/channel.html',
        status     : true,
        cookie     : true,
        xfbml      : true,
        oauth	   : true
    });

    return Backbone.Model.extend({


        initialize:function () {
            _.bindAll(this, 'onLoginStatusChange', 'sync');
            if (Globals.user){
                this.options = _.defaults(Globals.user, this.defaultOptions);
//                _.extend(this.options, {pictures:this.profilePictureUrls(this.options.id)});
                this.set(this.options);
//                _.extend(response, {
//                    pictures:this.profilePictureUrls(response.id)})
                this._loginStatus = "connected"
            } else {
                this.options = this.defaultOptions;
                FB.Event.subscribe('auth.authResponseChange', this.onLoginStatusChange);
                this.updateLoginStatus();
            }
//            this.set('location', this.get_location())
        },

        options:null,

        get_location : function(){
            console.log(google)
            if(google.loader.ClientLocation)
            {
                return {
                    lat : google.loader.ClientLocation.latitude,
                    lon : google.loader.ClientLocation.longitude,
                    city : google.loader.ClientLocation.address.city,
                    region : google.loader.ClientLocation.address.region,
                    country : google.loader.ClientLocation.address.country,
                    countrycode : google.loader.ClientLocation.address.country_code
                }
            }
            else
            {
                // ClientLocation not found or not populated
                // so perform error handling
                return null
            }
        },
        defaultOptions:{
            // see https://developers.facebook.com/docs/authentication/permissions/
            scope:['user_photos', 'publish_actions'], // fb permissions
            autoFetch:true, // auto fetch profile after login
            protocol:location.protocol
        },

        _loginStatus:null,

        login:function () {
            FB.login(this.onLoginStatusChange, { scope:this.options.scope.join(',') });
        },

        logout:function () {
            FB.logout(this.onLoginStatusChange);
        },

        updateLoginStatus:function () {
            FB.getLoginStatus(this.onLoginStatusChange);
        },

        onLoginStatusChange:function (response) {
            if (this._loginStatus === response.status) return false;
            var event;
            if (response.status === 'not_authorized') {
                event = 'facebook:unauthorized';
            } else if (response.status === 'connected') {
                this.set('token', response.authResponse.accessToken);
                event = 'facebook:connected';
                if (this.options.autoFetch === true) this.fetch();
            } else {
                event = 'facebook:disconnected';
            }
            this.trigger(event, this, response);
            this._loginStatus = response.status;

        },

        sync:function (method, model, options) {
            var This = this;
            if (method !== 'read') throw new Error('FacebookUser is a readonly model, cannot perform ' + method);
            var callback = function (response) {
                if (response.error) {
                    options.error(response);

                } else {
                    _.extend(response, {
                      pictures:This.profilePictureUrls(response.id)
                    });
                    options.success(response);
                }
                return true;
            };

            FB.api('/me', callback);

        },

        profilePictureUrls:function (id) {
            id || (id = this.id);
            var urls = {};
            _([ 'square', 'small', 'normal', 'large' ]).each(function (size) {
                urls[size] = this.profilePictureUrl(id, size);
            }, this);

            return urls;
        },

        profilePictureUrl:function (id, size) {
            return [
                this.options.protocol,
                '//graph.facebook.com/',
                id,
                '/picture?type=',
                size,
                this.options.protocol.indexOf('https') > -1 ? '&return_ssl_resources=1' : ''
            ].join('');
        }

    });
});

