define([
    'jquery',
    'underscore',
    'backbone',
    'views/us_map',
    'globals',
    'libs/d3/topojson',
    'd3'

], function ($, _, Backbone, map, Globals, topojson, d3) {

    return Backbone.View.extend({
        el: '#coverage',
        initialize: function(){

        },

        render: function() {
//            var width = $('#right').width();
//            var height = width * (3/4);

//            var svg = d3.select("#coverage_frame").append("svg")
//                .attr("width", width)
//                .attr("height", height);
            var frame = document.getElementById("map").contentDocument;
            var svg = d3.select(frame.getElementById('us_map'));
            console.log(svg)
            var width = 200;
            var height = 150;
//            var geojson = topojson.feature(map, map.objects.murcamap);
//            console.log(geojson)
            var projection = d3.geo.albersUsa()
                .scale(310)
                .translate([width / 2, height / 2]);
//
            var path = d3.geo.path().projection(projection);

//            svg.append("path")
//                .datum(geojson)
//                .attr("d", path)
//                .attr("class", "map")
//                .attr("id", "map");

//            var defs = svg.append('defs')
//                .append('clipPath')
//                .attr('id', 'map_path')
//                .append('use')
//                .attr('xlink:href', '#map');
//            xlink:href="#MyPath"
            svg.selectAll("path")
                .data(Globals.coverage.features)
                .enter().append("path")
                .attr("d", path)
                .attr("class", "cell");



//                .attr("id", "cell");
        }

    });
});
