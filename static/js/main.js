requirejs.config({

    paths: {
          jquery: "libs/jquery/jquery-1.9.1.min"
        , underscore : "libs/underscore/underscore-min"
        , backbone: "libs/backbone/backbone"
        , async: "libs/require/async"
        , d3: "libs/d3/d3.v2"
        , bootstrap : "libs/bootstrap/bootstrap"
        , fileupload : 'libs/fileupload/jquery.fileupload.js'
        , text : "libs/require/text"
        , handlebars : "libs/handlebars"
        , typeahead : "libs/bootstrap/bootstrap-typeahead"
        , intro : "libs/introjs/intro"
    },

    shim: {
        underscore: {
            exports: "_"
        }
        ,d3: {
            exports: "d3"
        }
        , backbone: {
            "deps": ["underscore", "jquery"],
            "exports": "Backbone"
        }

        , fileupload : {
            exports : "$",
            deps : ['jquery']
        }

        , bootstrap: {
            deps: ["jquery"]
        }
        , typeahead : {
            deps : ['jquery']
        }

        , handlebars : {
            exports : "Handlebars"
        }
        , intro : {
            exports : "intro"
        }
    }

});

require([
          'front/front'
        , 'route/route'
        , 'main/trailsearch'
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
