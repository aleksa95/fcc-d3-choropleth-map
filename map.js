const projectName="choropleth";

var body = d3.select("body");

var margin = { top: 20, right: 100, bottom: 20, left: 120 };
var width = 1200 - margin.left - margin.right;
var height = 725 - margin.top - margin.bottom;

var map = d3.select("svg")
  .attr('width', width   + margin.left + margin.right)
  .attr('height', height + margin.top  + margin.bottom)
  .call(responsivefy)
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

var tooltip = body.append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);

var path = d3.geoPath();

var x = d3.scaleLinear()
  .domain([2.6, 75.1])
  .rangeRound([500, 1000]);

var color = d3.scaleThreshold()
  .domain(d3.range(2.6, 75.1, (75.1-2.6)/8))
  .range(d3.schemeRdYlGn[9]);

var legend = map.append("g")
  .attr("class", "key")
  .attr("id", "legend")
  .attr("transform", "translate(-269,0)");

legend.selectAll("rect")
  .data(color.range().map(function(d) {
    d = color.invertExtent(d);
    if (d[0] == null) d[0] = x.domain()[0];
    if (d[1] == null) d[1] = x.domain()[1];
    return d;
  }))
  .enter().append("rect")
  .attr("height",   8)
  .attr("x", function(d) { return x(d[0]); })
  .attr("width", function(d) { return x(d[1]) - x(d[0]); })
  .attr("fill", function(d) { return color(d[0]); });

legend.append("text")
  .attr("class", "caption")
  .attr("x", x.range()[0])
  .attr("y", -6)
  .attr("fill", "#000")
  .attr("text-anchor", "start")
  .attr("font-weight", "bold");

legend.call(d3.axisBottom(x)
  .tickSize(13)
  .tickFormat(function(x) { return Math.round(x) + '%' })
  .tickValues(color.domain()))
  .select(".domain")
  .remove();

function responsivefy(map) {
  var container = d3.select(("body")),
    width  = parseInt(map.style("width")),
    height = parseInt(map.style("height")),
    aspect = width / height;
  map.attr("viewBox", "0 0 " + width + " " + height)
    .attr("preserveAspectRatio", "xMinYMid")
    .call(resize);
  d3.select(window).on("resize." + container.attr("id"), resize);
  function resize() {
    var targetWidth = parseInt(container.style("width"));
    map.attr("width", targetWidth);
    map.attr("height", Math.round(targetWidth / aspect));
  }
}

d3.queue()
  .defer(d3.json, 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json')
  .defer(d3.json, 'https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json')
  .await(ready);

function ready(error, us, education) {
  if (error) throw error;

  map.append("g")
    .attr("class", "counties")
    .attr("transform", "translate(0, 75)")
    .selectAll("path")
    .data(topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
    .attr("class", "county")
    .attr("data-fips", function(d) {
      return d.id
    })
    .attr("data-education", function(d) {
      var result = education.filter(function( obj ) {
        return obj.fips == d.id;
      });
      if(result[0]){
        return result[0].bachelorsOrHigher
      }
      //could not find a matching fips id in the data
      console.log('could find data for: ', d.id);
      return 0
    })
    .attr("fill", function(d) {
      var result = education.filter(function( obj ) {
        return obj.fips == d.id;
      });
      if(result[0]){
        return color(result[0].bachelorsOrHigher)
      }
      //could not find a matching fips id in the data
      return color(0)
    })
    .attr("d", path)
    .on("mouseover", function(d) {
      tooltip.style("opacity", .9);
      tooltip.html(function() {
        var result = education.filter(function( obj ) {
          return obj.fips == d.id;
        });
        if(result[0]){
          return result[0]['area_name'] + ', ' + result[0]['state'] + ': ' + result[0].bachelorsOrHigher + '%'
        }
        //could not find a matching fips id in the data
        return 0
      })
        .attr("data-education", function() {
          var result = education.filter(function( obj ) {
            return obj.fips == d.id;
          });
          if(result[0]){
            return result[0].bachelorsOrHigher
          }
          //could not find a matching fips id in the data
          return 0
        })
        .style("left", (d3.event.pageX + 10) + "px")
        .style("top", (d3.event.pageY - 28) + "px"); })
    .on("mouseout", function(d) {
      tooltip.style("opacity", 0);
    });

  map.append("path")
    .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
    .attr("class", "states")
    .attr("d", path);
}