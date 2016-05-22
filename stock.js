(function(){
    d3.stock = function() {
        var chartStyle = "candles",
            name = "", symbol = "",
            count = 160, days = 0,
            node, width, height, margin,
            months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            indicators = {
                names: ["ma5", "ma10", "ma20", "ma30"],
                colors: {ma5: "#660000", ma10: "#CC0033", ma20: "#FF0000", ma30: "#CC6600"},
                active: [],
            },
            chart, bgLayer, axisLayer, volumeLayer, priceLayer, indicatorLayer, mouseOverlay,
            x, x1, y, y1, y2,
            position = 0,
            focus, current,
            xTip, yTip, xText, yText,
            ticks = [],
            data, length;

        function stock(gParent) {
            node = gParent[0][0];
            gParent.each(function(d, i) {
                data = d;
            });

            chart = d3.select(node);
            var gParentSize = node.getBoundingClientRect();

            width = gParentSize.width - 50;
            height = gParentSize.height - 30;
        
            margin = {top: 0, right: 50, bottom: 50, left: 0};
            name   = data.name;
            symbol = data.symbol;

            var parseDate  = d3.time.format('%a %b %d %X %Z %Y').parse;
            data = data.list.map(function(d){ d.time = parseDate(d.time); return d;})
            length = data.length;
        
            days = (data[length-1].time - data[0].time)/(24*3600*1000);

            stock.setTicks(); 
            stock.initScale();
        
            //Layers
            bgLayer = chart.append("svg:g").attr("class", "background")
            stock.drawBackground();

            axisLayer = chart.append("svg:g").attr("class", "axis")
            stock.drawAxis();

            volumeLayer = chart.append("svg:g").attr("attr", "volume-overlay");
            stock.drawVolume();

            focus = current = data[data.length-1];
            priceLayer = chart.append("svg:g").attr("class", "price-overlay")
            stock.drawPrice();

            indicatorLayer = chart.append("svg:g").attr("class", "indicators")
            stock.drawIndicators();

            // Mouse move
            mouseOverlay = chart.append("svg:g")
                .attr('transform', 'translate('+ margin.left +', ' + margin.top +')')
                .attr("class", "mouse-overlay")
                .on('mouseover', function() {
                    xLine.attr("stroke-width", 1)
                    yLine.attr("stroke-width", 1)
                })
                .on('mouseleave', function() {
                    var pos = d3.mouse(this);
                    if(pos[0] > width || pos[0] <= margin.left || pos[1] > height || pos[1] <= 0) {
                        xLine.attr("stroke-width", 0)
                        yLine.attr("stroke-width", 0)
                        xTip.style("visibility", 'hidden')
                        yTip.style("visibility", 'hidden')
                    }
                })
                .on('mousemove', stock.handleMouseMove);

            stock.drawMouseOverlay();

            // Zoom
            var zoom = d3.behavior.zoom().scaleExtent([0.1, 10]).on("zoom", zoomed);

            function zoomed() {
                d3.select(this).attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }
            chart.call(zoom);

            return stock;
        }

        stock.drawMouseOverlay = function() {
            var mouseArea = mouseOverlay.append("svg:rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("height", height)
                .attr("width", width)

            xLine = chart.append("svg:line")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", 0)
                .attr("y2", 0)
                .attr("stroke", "#959595")
                .style("stroke-dasharray", ("3, 3")) //虚线
                .style("stroke-opacity", 0.9)
                .attr('transform', 'translate('+ margin.left +', '+ margin.top +')')
        
            yLine = chart.append("svg:line")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", 0)
                .attr("y2", 0)
                .attr("stroke", "#959595")
                .style("stroke-dasharray", ("3, 3")) //虚线
                .style("stroke-opacity", 0.9)
                .attr('transform', 'translate('+ margin.left +', '+ margin.top +')')
        
            // Position of mouse
            xTip = chart.append("svg:g")
                .attr('transform', 'translate(0,0)')
                .style('visibility', 'hidden')
            xTip.append('svg:rect').attr('width', 105)
                .attr('height', 20)
                .attr('fill', "#7B7B7B")
            xText = xTip.append('svg:text')
                .text('')
                .attr("transform", "translate(3, 3)")
                .attr("dy", "1em")
                .style("fill", "#ffffff")
        
            yTip = chart.append("svg:g")
                .attr('transform', 'translate(0,0)')
                .style('visibility', 'hidden')
            yTip.append('svg:rect').attr('width', 52)
                .attr('height', 18)
                .attr('fill', "#7B7B7B")
            yText = yTip.append('svg:text')
                .text('')
                .attr("transform", "translate(3, 0)")
                .attr("dy", "1em")
                .style("fill", "#ffffff")
        }

        stock.handleMouseMove = function() {
          var pos  = d3.mouse(this);
          var x0   = x.invert(pos[0]);
          var y0   = y.invert(pos[1]);
          var i    = Math.round(x0);
          focus    = data[i];
          var posX = x1(i) + 0.45*width/data.length;
          var posY = pos[1];
          xLine.attr("x1", 0)
              .attr("x2", width)
              .attr("y1", posY)
              .attr("y2", posY)
          yLine.attr("x1", posX)
              .attr("x2", posX)
              .attr("y1", 0)
              .attr("y2", height)
        
          xTip.attr('transform', 'translate(' + (margin.left+posX-52.5)+', ' + (margin.top+height)+ ')')
            .style('visibility', '')
          xText.text(stock.formatDate(data[i].time))
          yTip.attr('transform', 'translate(' + (margin.left+width)+', ' + (margin.top+posY-9)+ ')')
            .style('visibility', '')
          yText.text(y0.toFixed(2))
        }

        stock.formatTime      = d3.time.format("%H:%M");
        stock.formatDate      = d3.time.format("%Y-%m-%d %H:%M");
        stock.formatDay       = d3.time.format("%Y-%m-%d");
        stock.formatMonth     = d3.time.format("%m");
        stock.formatYearMonth = d3.time.format("%Y-%m");
        stock.formatYear      = d3.time.format("%Y");

        stock.setTicks = function() {
            if(days < 1) {
                var timeTicks = ["10:30", "13:00", "14:00"];
                for(i in data) {
                    if(timeTicks.indexOf(stock.formatTime(data[i].time)) !== -1) ticks.push(+i);
                }
            } else if (days <= 366) {
                for(i = 1; i < length; i++) {
                    if(stock.formatMonth(data[i].time) != stock.formatMonth(data[i-1].time)) ticks.push(+i);
                }
            } else if (days < 5 * 366) {
                for(i = 1; i < length; i++) {
                    var isSameMonth = stock.formatMonth(data[i].time) != stock.formatMonth(data[i-1].time);
                    if( isSameMonth && ['01', '04', '07', '10'].indexOf(stock.formatMonth(data[i].time)) != -1) ticks.push(+i);
                }
            } else {
                for(i = 1; i < length; i++) {
                    if(stock.formatYear(data[i].time) != stock.formatYear(data[i-1].time)) ticks.push(+i);
                }
            }
        }

        stock.tickFormat = function(t){
            if(days < 1) {
              return stock.formatTime(t);
            } else if(days <= 366) {
              var m = +stock.formatMonth(t);
              return m == 1 ? stock.formatYear(t) : months[m-1];
            } else if(days <= 5 * 366) {
            } else {
            }
        }

        stock.initScale = function() {
            // Scale
            x = d3.scale.linear().range([0, width]).domain([0,data.length]);
            x1 = d3.scale.linear().range([0, width]).domain([0,data.length]);

            // Adjust domain for gap of top and bottom.
            var min = d3.min(data, function(d) { return d.low; });
            var max = d3.max(data, function(d) { return d.high; });
            if(max == min) max += 10;
            var gap = (max - min) / 10;
            var domain = [min-gap, max+gap];

            // y1 is price, y2 is volume.
            y = d3.scale.linear().range([height,0]).domain(domain),
            y1 = d3.scale.linear().range([height, 0]).domain(d3.extent(data, function(d) { d.close; })),
            y2 = d3.scale.linear().range([height/5, 0]).domain([0, d3.max(data, function(d) { return d.volume; })]);
        }
        
        stock.drawBackground = function() {
            bgLayer.selectAll("*").remove();

            var bText = bgLayer.append('svg:text')
                .attr("x",  width / 2)
                .attr("y",  height / 2 - 200)
                .attr("text-anchor", "middle")
                .style("font-size", 50)
                .style("fill", "#E6E6E6");
            bText.append("tspan").text(symbol).attr("font-size", 90).attr("dy", "1em")
            bText.append("tspan").text(name).attr("x", width / 2).attr("font-size", 60).attr("dy", "1.6em")
        }

        stock.drawAxis = function() {
            axisLayer.selectAll("*").remove();

            // Axis
            var xAxis = d3.svg.axis().scale(x).orient("bottom").tickFormat(function(d){return stock.tickFormat(data[d].time);}).tickValues(ticks),
            yAxis = d3.svg.axis().scale(y).orient("right").ticks(5);

            // xAxis
            axisLayer.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate('+ margin.left +',' + (height+margin.top) + ')')
                .call(xAxis)
        
            // yAxis 
            axisLayer.append('g')
                .attr('class', 'y axis')
                .attr('transform', 'translate('+ (margin.left+width) +', '+ margin.top +')')
                .call(yAxis)
        
            // Grid
            var yAxisGrid = yAxis 
               .tickSize(width, 0)
               .tickFormat("")
               .orient("right");
        
            var xAxisGrid = xAxis
               .tickSize(-height, 0)
               .tickFormat("")
               .orient("top");
        
            axisLayer.append("g")
               .classed('y', true)
               .classed('axis', true)
               .call(yAxisGrid)
               .attr('transform', 'translate('+margin.left+', '+margin.top+')');
        
            axisLayer.append("g")
               .classed('x', true)
               .classed('axis', true)
               .call(xAxisGrid)
               .attr('transform', 'translate('+margin.left+', '+margin.top+')');
        }

        stock.drawVolume = function() {
            volumeLayer.selectAll("*").remove();

            volumeLayer.selectAll("rect.volume")
                .data(data)
                .enter()
                .append("svg:rect")
                .attr("x",function(d,i){
                    return x1(i);
                })
                .attr("y", function(d) {
                    return -y2(d.volume);
                })
                .attr("width",function(d){
                    return width/data.length;
                })
                .attr("height",function(d){
                    return y2(d.volume);
                })
                .attr("fill",function(d){ return d.open < d.close ? "#EFE3E3" : "#DEEEE0"; })
                .attr("stroke",function(d){ return d.open < d.close ? "#D9CFCF" : "#C5D3C7"; })
                .attr("stroke-width", 1)
                .attr('transform', 'translate('+ margin.left +',' + (height+margin.top) + ')')
        }

        stock.drawPrice = function() {
            //Remove old ticks.
            priceLayer.selectAll("*").remove();

            //Price chart.
            switch(chartStyle) {
                case "candles":
                    priceLayer.selectAll("line.stem")
                        .data(data)
                        .enter().append("svg:line")
                        .attr("class", "stem")
                        .attr("x1", function(d,i) { return Math.round(x1(i) + 0.35*width/data.length);})
                        .attr("x2", function(d,i) { return Math.round(x1(i) + 0.35*width/data.length);})       
                        .attr("y1", function(d) { return y(d.high);})
                        .attr("y2", function(d) { return y(d.low); })
                        .attr("stroke", "#5A5A5A")
                        .attr("stroke-width", 1)
                        .attr('transform', 'translate('+ margin.left +', '+ margin.top +')')
                    priceLayer.selectAll("rect.k")
                        .data(data)
                        .enter().append("svg:rect")
                        .attr("x", function(d,i) { return x1(i); })
                        .attr("y", function(d) { return y(d.open > d.close ? d.open : d.close);})
                        .attr("height", function(d) {return d.open > d.close ? y(d.close) - y(d.open) : y(d.open) - y(d.close);})
                        .attr("width", function(d) { return Math.round(0.7 * (width)/data.length); })
                        .attr("fill",function(d) { return d.open > d.close ? "#6BA583" : "#D75442";})
                        .attr("stroke",function(d){ return d.open > d.close ? "#386D4E" : "#A03A2D"; })
                        .attr("stroke-width", 1)
                        .attr('transform', 'translate('+ margin.left +', '+ margin.top +')')
                    break;
                case "line":
                    var priceLine = d3.svg.line()
                        .interpolate("monotone")
                        .x(function(d, i){ return x1(i)})
                        .y(function(d){ return y(d.close)});
                    priceLayer.append("path")
                        .datum(data)
                        .attr('transform', 'translate('+ margin.left +',0)')
                        .style("stroke", "steelblue")
                        .attr("class", "line")
                        .attr("d", priceLine)
                        .attr('transform', 'translate('+ margin.left +', ' + margin.top +')')
                    break;
                case "area":
                    var priceLine = d3.svg.line()
                        .interpolate("monotone")
                        .x(function(d, i){ return x1(i)})
                        .y(function(d){ return y(d.close)});
                    priceLayer.append("path")
                        .datum(data)
                        .attr('transform', 'translate('+ margin.left +',0)')
                        .attr("class", "line")
                        .attr("d", priceLine)
                        .attr('transform', 'translate('+ margin.left +', ' + margin.top +')')

                    var priceArea = d3.svg.area()
                        .x(function(d, i) { return x1(i); })
                        .y0(margin.top+height)
                        .y1(function(d) { return y(d.close); });
                    priceLayer.append("path")
                        .datum(data)
                        .attr('transform', 'translate('+ margin.left +',0)')
                        .attr("class", "line")
                        .attr("d", priceArea)
                        .attr("transform", "translate("+ margin.left +", " + margin.top +")")
                        .style("fill", "steelblue")
                        .style("stroke", "none")
                        .style("opacity", 0.2);
                    break;
            }
            stock.drawLastPrice();
        }

        stock.drawLastPrice = function() {
            var price = priceLayer.append("svg:g")
                .attr('transform', 'translate(' + (margin.left+width)+', ' + (margin.top+y(current.close)-9)+ ')')
            price.append('svg:rect').attr('width', 52)
                .attr('height', 18)
                .attr('fill', current.open > current.close ? "#6BA583" : "#D75442")
            price.append('svg:text')
                .text(current.close.toFixed(2))
                .attr("transform", "translate(3, 0)")
                .attr("dy", "1em")
                .style("fill", "#ffffff");
        
            chart.append("svg:line")
                .attr("x1", 0)
                .attr("x2", margin.left+width)
                .attr("y1", margin.top+y(current.close))
                .attr("y2", margin.top+y(current.close))
                .attr("stroke", current.open > current.close ? "#6BA583" : "#D75442")
                .attr("stroke-width", 1)
                .style("stroke-dasharray", ("3, 3"))
                .style("stroke-opacity", 0.9);
        }

        stock.drawIndicators = function() {
            //Remove old ticks.
            indicatorLayer.selectAll("*").remove();

            for(var i in indicators.active) {
                var indicator = indicators.names[i];
                var line = d3.svg.line()
                    .interpolate("monotone")
                    .x(function(d, i){ return x1(i)})
                    .y(function(d){ return y(d[indicator])});
                indicatorLayer.append("path")
                    .datum(data)
                    .style("stroke", indicators.colors[indicator])
                    .attr('transform', 'translate('+ margin.left +',0)')
                    .attr("class", "line")
                    .attr("d", line)
                    .attr('transform', 'translate('+ margin.left +', ' + margin.top +')')
            }
        }

        stock.width = function(w) {
            chart.attr("width", w);
            width = w - 50;
            return stock;
        }

        stock.height = function(h) {
            chart.attr("height", h);
            height = h - 30;
            return stock;
        }

        stock.style = function(style) {
            chartStyle = style;
            return stock;
        }

        stock.indicator = function(indicator) {
            var idx = indicators.active.indexOf(indicator);
            if(idx== -1) {
                indicators.active.push(indicator);
            } else {
                indicators.active.splice(idx, 1);
            }
            stock.drawIndicators();
            return stock;
        }

        stock.focus = function() {
            return focus;
        }

        stock.redraw = function() {
            stock.initScale();
            stock.drawBackground();
            stock.drawAxis();
            stock.drawVolume();
            stock.drawPrice();
            stock.drawIndicators();
        }
        return stock;
    }
})();
