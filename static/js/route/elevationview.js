// Use this as a quick template for future modules
define([
    'jquery',
    'underscore',
    'backbone',
    'utils',
    'd3'
], function($, _, Backbone, Utils, d3){

    return Backbone.View.extend({

        initialize:function () {
            _.bindAll(this);

        },
        interval : function(){
            var kmp = this.model.get('properties').distance / this.model.get('properties').elevations.length;
            return (this.model.get('metric')) ? kmp / 1000 : kmp * 0.000621371;
        },
        legend: function() {

            return obj = {
                 distance : (this.model.get('metric')) ? 'kilometers' : 'miles'
                , elevation : (this.model.get('metric')) ? 'meters' : 'feet'
            };
        },

        render: function() {
            var that = this;
            var to_metric_el = function(num){return (that.model.get('metric')) ? num : num * 3.28084};
            var elevations = this.model.get('properties').elevations;
            var k_distance = this.model.get('properties').distance / 1000;
            var margin = {left:70, right:10, bottom:50, top:20},
                width = this.$el.width() - margin.left - margin.right,
                height = this.$el.height() - 20 - margin.top - margin.bottom;
            var max, min, offset, xvals, x, y, data, xAxis, yAxis;

            var calculate_values = function() {
                max = to_metric_el(_.max(elevations));
                min = to_metric_el(_.min(elevations));
                var mean = (max + min)/2;
                var delta = _.max([300, ((max-min)*0.8)]);
                var distance = (that.model.get('metric')) ? k_distance: (k_distance * 0.621371);
                var interval = that.interval();
                xvals = _.map(_.range(elevations.length), function(num){return num * interval}, that);
                data = _.zip(xvals, _.map(elevations, to_metric_el, that));
                x = d3.scale.linear()
                    .domain([0, distance])
                    .range([0, width]);
                y = d3.scale.linear()
                    .domain([mean-delta, mean+delta])
                    .range([height,0]);
                xAxis = d3.svg.axis()
                    .scale(x).orient("bottom");
                yAxis = d3.svg.axis()
                    .scale(y).orient("left");
            };

            calculate_values();
            var area = d3.svg.area()
                .x(function(d){return x(d[0])})
                .y0(height)
                .y1(function(d) {return y(d[1])});

            var line = d3.svg.line()
                .x(function(d) {return x(d[0]);})
                .y(function() {return y((max+min)/2);});

            var svg = d3.select(this.el)
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var xlabel = svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
                .append("text")
                .attr("x", "50%")
                .attr("dx", "2.5em")
                .attr("dy", "2.5em")
                .style("text-anchor", "end")
                .text("Distance in " + this.legend().distance);

            var ylabel = svg.append("g")
                .attr("class", "y axis")
                .call(yAxis) //returns selection g
                .append("text") //returns text
                .attr("transform", "rotate(-90)")
                .attr("y", -50)
                .attr("x", '-15%')
//                .attr("dx", '-6em')
                .style("text-anchor", "end")
                .text("Elevation in " + this.legend().elevation);

            var gradient = svg.append("svg:defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");

            gradient.append("svg:stop")
                .attr("offset", "25%")
                .attr("stop-color", "#013435")
                .attr("stop-opacity", 1);

            gradient.append("svg:stop")
                .attr("offset", "100%")
                .attr("stop-color", "#fff")
                .attr("stop-opacity", 0.8);

            var path = svg.append("path")
                .datum(data)
                .attr("class", "line")
                .attr("d", line);

            path.transition()
                .style("fill", "url(#gradient)")
                .attr("d", area)
                .attr("class", "area")
                .duration(1000);

            this.model.on('metric', function(){
                calculate_values(this);
                svg.select(".x.axis").transition().duration(1000).call(xAxis);
                svg.select(".y.axis").transition().duration(1000).call(yAxis);
                xlabel.transition().duration(1000).text("Distance in " + this.legend().distance);
                ylabel.transition().duration(1000).text("Elevation in " + this.legend().elevation);
            }, this);

            return this
        }
        , close : function() {
            this.unbind();
            this.remove();
        }

    });
});



