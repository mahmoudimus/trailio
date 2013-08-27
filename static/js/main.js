requirejs.config({
//todo: make sure minified js are selected
    paths: {
        "jquery": "libs/jquery/jquery-1.9.1",
        "jquery-ui": "libs/jquery/jquery-ui-1.10.2.custom.min",
//        "underscore": "https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore",
        "underscore" : "libs/underscore/underscore-min",
        "backbone": "libs/backbone/backbone",
        "async": "libs/require/async",
        "d3": "libs/d3/d3.v2",
//        "bootstrap": "https://netdna.bootstrapcdn.com/twitter-bootstrap/2.3.0/js/bootstrap.min",
        "bootstrap" : "libs/bootstrap/bootstrap.min",
        'fileupload' : 'libs/fileupload/jquery.fileupload.js',
        "text" : "libs/require/text",
        "handlebars" : "libs/handlebars"
    },

    shim: {
        "underscore": {
            exports: "_"
        },
        "d3": {
            exports: "d3"
        },
        "backbone": {
            "deps": ["underscore", "jquery"],
            "exports": "Backbone"
        },

        "jquery-ui": {
            exports: "$",
            deps: ['jquery']
        },
        fileupload : {
            exports : "$",
            deps : ['jquery']
        },

        "bootstrap": {
            "deps": ["jquery"],
            "exports": "$.fn.popover"
        },
        "handlebars" : {
            "exports" : "Handlebars"
        }

    }

});

require(['front/front',
        'route/route',
        'main/trailsearch'
        ],
function(Front, Route, TrailSearch){
    $(document).on("click", "a[href]", function(evt) {
        if ($(this).attr("href") == '#'){
            evt.preventDefault()
        }
    });

    this.trailsearch = new TrailSearch();
    var page = location.pathname.split('/')[1];
    switch (page){
        case '':
            new Front();
            break;
        case 'route':
            new Route();
            break;
        case 'named_route':
            new Route();
            break;


    }
//    console.log(page)
});
