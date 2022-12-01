 var svg = d3.select("svg"),
        width = +svg.attr("width"),
        height = +svg.attr("height");

    var projection = d3.geoAlbersUsa()
        .translate([width / 2 - 300, height / 2 - 700])
        .scale([6000]);

    var path = d3.geoPath().projection(projection);

    // Colors
    var colors1 = d3.scaleThreshold()
        .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
        .range(d3.schemeOrRd[9]);
    
    var colors2 = d3.scaleThreshold()
        .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
        .range(d3.schemeYlOrBr[9]);

    // Functions to get county data from csv file using common ID
    var densityById = d3.map();
    var nameById = d3.map();
    
    var x = d3.scaleSqrt()
        .domain([0, 4500])
        .rangeRound([440, 950]);

    var g = svg.append("g")
        .attr("class", "key")
        .attr("transform", "translate(0,40)");

    //Create Legends
    var legend1 = g.selectAll("rect1")
      .data(colors1.range().map(function(d) {
          d = colors1.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return colors1(d[0]); });
    
    var legend2 = g.selectAll("rect2")
      .data(colors2.range().map(function(d) {
          d = colors2.invertExtent(d);
          if (d[0] == null) d[0] = x.domain()[0];
          if (d[1] == null) d[1] = x.domain()[1];
          return d;
        }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return x(d[0]); })
        .attr("width", function(d) { return x(d[1]) - x(d[0]); })
        .attr("fill", function(d) { return colors2(d[0]); })
        .style("opacity", 0);

    g.append("text")
        .attr("class", "caption")
        .attr("x", x.range()[0])
        .attr("y", -6)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text("Population per square mile");

    g.call(d3.axisBottom(x)
        .tickSize(13)
        .tickValues(colors1.domain()))
      .select(".domain")
        .remove();

    // Get Data from csv file
    d3.queue()
    .defer(d3.json, "us-10m.json")
    .defer(d3.csv, "Population-Density By County.csv", function(d) { densityById.set(d.id, +d.density);
    nameById.set(d.id, d.displayLabel); })
    .await(ready);
        
    function ready(error, mass) {
        if (error) throw error;

        // Color each county based on density
        var fill1 = svg.append("g").selectAll("path")
           .data(topojson.feature(mass, mass.objects.counties).features.filter(function(d) {
            return densityById.get(d.id) }))
           .enter()
           .append("path")
           .attr("d", path)
           .style("fill", function(d) { return colors1(densityById.get(d.id)); });
        
        var fill2 = svg.append("g").selectAll("path")
           .data(topojson.feature(mass, mass.objects.counties).features.filter(function(d) {
            return densityById.get(d.id) }))
           .enter()
           .append("path")
           .attr("d", path)
           .style("fill", function(d) { return colors2(densityById.get(d.id)); })
           .style("opacity", 0)
        
           // Add Tooltip
            .on("mousemove", function(d) {
            d3.select("#tooltip")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 50) + "px")
                d3.select("#county")
                .text(nameById.get(d.id))
                d3.select("#density")
                .text(densityById.get(d.id))
                d3.select("#tooltip").classed("hidden", false);
            })
            .on("mouseout", function(d) {
                d3.select("#tooltip").classed("hidden", true);
            });;
        
        //Draw county borders, one for each color scheme
        var borders1 = fill1
            .data(topojson.feature(mass, mass.objects.counties).features.filter(function(d) {
            return densityById.get(d.id) }))
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.3)
            .attr("d", path);
        
        var borders2 = fill2
            .data(topojson.feature(mass, mass.objects.counties).features.filter(function(d) {
            return densityById.get(d.id) }))
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.3)
            .attr("d", path);
        
        //Buttons
        svg.append("rect")
            .attr('x', 120)
            .attr('y', 350)
            .attr('width', 110)
            .attr('height', 30)
            .attr('fill', "#ffb85c")
            .on('click', function() { bordersControl() } )

        //Turn stroke off and on
        function bordersControl(){
              if (borders1.attr("stroke") == "none") {
                  borders1.attr("stroke", "#000");
                  borders2.attr("stroke", "#000");
              } else {
                  borders1.attr("stroke", "none");
                  borders2.attr("stroke", "none");
              }
          }

        svg.append("text")
            .attr('x', 125)
            .attr('y', 370)
            .attr('width', 100)
            .attr('pointer-events', 'none')
            .text("Toggle Borders")
        
        svg.append("rect")
            .attr('x', 120)
            .attr('y', 400)
            .attr('width', 110)
            .attr('height', 30)
            .attr('fill', "#ffb85c")
            .on('click', function() { swapColors() } )

        //Swap which map is being shown
        function swapColors(){
              if (legend1.style("opacity") == 0) {
                  legend1.style("opacity", 1);
                  fill1.style("opacity", 1);
                  legend2.style("opacity", 0);
                  fill2.style("opacity", 0);
              } else {
                  legend1.style("opacity", 0);
                  fill1.style("opacity", 0);
                  legend2.style("opacity", 1);
                  fill2.style("opacity", 1);
              }
          }
        

        svg.append("text")
            .attr('x', 125)
            .attr('y', 420)
            .attr('width', 100)
            .attr('pointer-events', 'none')
            .text("Swap Colors")
    };