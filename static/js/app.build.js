
({
    name: "main",
    out: "main.built.js",
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
})