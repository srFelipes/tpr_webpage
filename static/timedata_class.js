// Timedata class for timeseries display
class Timedata{

    // Class constructor
    constructor(dom_elements, dimensions, margin){

        this.timedata_svg = d3.select(dom_elements.timedata_name);
        this.dataselection_name = dom_elements.dataselection_name;
        this.selected_map = dom_elements.selected_map;
        this.voltage_disp = dom_elements.voltage_name;
        this.margin = margin;

        // Check if window dimensions are more vertical or horizontal (considering margins)
        if(dimensions.width - margin.left - margin.right <= dimensions.height - margin.top - margin.bottom){
            this.svgWidth = dimensions.width - margin.left - margin.right;
            this.svgHeight = dimensions.width - margin.top - margin.bottom;
        }
        else{
            this.svgWidth = dimensions.height - margin.left - margin.right;
            this.svgHeight = dimensions.height - margin.top - margin.bottom;
        }
    }

    // Initialize timeseries dimensions and position
    initializeSerie(data, data_format){

        // Save object (Timedata) instance
        var self = this;
        var volt_opt = $(self.voltage_disp).is(':checked');

        // Set SVG Map dimensions
        self.timedata_svg.attr('width', self.svgWidth + self.margin.left + self.margin.right);
        self.timedata_svg.attr('height', self.svgHeight + self.margin.top + self.margin.bottom);

        // Define display translation on SVG
        var g = self.timedata_svg.append('g')
            .attr('transform', 'translate(' + self.margin.left + ',' + self.margin.top + ')');

        // Define x and y axis scale dimensions with respect to SVG
        var x = d3.scaleTime().rangeRound([0, self.svgWidth - 50]);
        var y = d3.scaleLinear().rangeRound([self.svgHeight, 0]);

        // Define line graphic from parsed data
        var line = d3.line()
            .x(function(d){ return x(d.date) })
            .y(function(d){ return y(d.value) });

        // Define x and y domain values
        x.domain(d3.extent(data, function(d){ return d.date }));
        y.domain(d3.extent(data, function(d){ return d.value }));

        // Add background grid to SVG on x axis
        g.append('g')
        .attr('class', 'grid')
        .call(d3.axisBottom(x).ticks(10)
            .tickSize(self.svgHeight)
            .tickFormat('')
        );

        // Add background grid to SVG on y axis
        g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5)
            .tickSize(-(self.svgWidth-50))
            .tickFormat('')
        );

        // Add text on x axis on SVG
        g.append('g')
        .attr('class', 'white_axis')
        .attr('transform', 'translate(0,' + self.svgHeight + ')')
        .call(d3.axisBottom(x))

        // Add a thich line over the x axis on SVG
        g.append('g')
        .attr('class', 'white_axis')
        .call(d3.axisBottom(x))
        .attr('stroke-width', 2)
        .selectAll('text')
        .remove()

        // Add a thich line over the y axis on SVG
        g.append('g')
        .attr('class', 'white_axis')
        .attr('transform', 'translate(' + parseInt(self.svgWidth - 50) + ', 0)')
        .call(d3.axisLeft(y))
        .attr('stroke-width', 2)
        .selectAll('text')
        .remove()

        // Add text on y axis on SVG
        var unit_disp = (volt_opt) ? ' V' : data_format.units[self.selected_map]
        g.append('g')
        .attr('class', 'white_axis')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('id', 'serie_unit')
        .attr('fill', '#000')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('dx', '-0.71em')
        .attr('text-anchor', 'end')
        .text($(self.dataselection_name).val() +' [' + unit_disp +']');
    }

    // Render data on timedata
    drawChart(dom_elements, data_unparsed, data_format) {

        // Save object (Timedata) instance
        var self = this;

        self.selected_map = dom_elements.selected_map;
        var volt_opt = $(self.voltage_disp).is(':checked');

        // Parse data
        var data = [];
        for(var i = 0; i < data_unparsed.length; i++) {
            data.push(
            {
                date: new Date(data_unparsed[i]['date']),
                value: data_unparsed[i]['value']
            })
        }

        // Remove old data
        self.timedata_svg.selectAll('*').remove();

        // Define display translation on SVG
        var g = self.timedata_svg.append('g')
            .attr('transform', 'translate(' + self.margin.left + ',' + self.margin.top + ')');

        // Define x and y axis scale dimensions with respect to SVG
        var x = d3.scaleTime().rangeRound([0, self.svgWidth - 50]);
        var y = d3.scaleLinear().rangeRound([self.svgHeight, 0]);

        // Define line graphic from parsed data
        var line = d3.line()
            .x(function(d){ return x(d.date) })
            .y(function(d){ return y(d.value) });

        // Define x and y domain values
        x.domain(d3.extent(data, function(d){ return d.date }));
        if(self.selected_map == 'TemperatureNode'){
            if(volt_opt == true){
                y.domain([0, 3.3])
            }
            else{
                y.domain([-20, 60])
            }
        }
        else if(self.selected_map == 'VoltageNode'){
            y.domain([2.2, 4.4])
        }
        else if(self.selected_map == 'MoistureNode'){
            if(volt_opt == true){
                y.domain([0, 3.3])
            }
            else{
                y.domain([-10, 110])
            }
        }
        else if(self.selected_map == 'AccelerationNode'){
            y.domain([-1.2, 1.2])
        }
        else if(self.selected_map == 'ElevationNode'){
            y.domain([-90, 90])
        }
        else if(self.selected_map == 'AzimuthNode'){
            y.domain([-180, 180])
        }
        else{
            y.domain(d3.extent(data, function(d){ return d.value }));
        }

        // Add background grid to SVG on x axis
        g.append('g')
        .attr('class', 'grid')
        .call(d3.axisBottom(x).ticks(10)
            .tickSize(self.svgHeight)
            .tickFormat('')
        );

        // Add background grid to SVG on y axis
        g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(y).ticks(5)
            .tickSize(-(self.svgWidth-50))
            .tickFormat('')
        );

        // Add text on x axis on SVG
        g.append('g')
        .attr('class', 'white_axis')
        .attr('transform', 'translate(0,' + self.svgHeight + ')')
        .call(d3.axisBottom(x))

        // Add a thich line over the x axis on SVG
        g.append('g')
        .attr('class', 'white_axis')
        .call(d3.axisBottom(x))
        .attr('stroke-width', 2)
        .selectAll('text')
        .remove()

        // Add a thich line over the y axis on SVG
        g.append('g')
        .attr('class', 'white_axis')
        .attr('transform', 'translate(' + parseInt(self.svgWidth - 50) + ', 0)')
        .call(d3.axisLeft(y))
        .attr('stroke-width', 2)
        .selectAll('text')
        .remove()

        // Add text on y axis on SVG
        var unit_disp = (volt_opt) ? ' V' : data_format.units[self.selected_map]
        g.append('g')
        .attr('class', 'white_axis')
        .call(d3.axisLeft(y))
        .append('text')
        .attr('id', 'serie_unit')
        .attr('fill', '#000')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('dx', '-0.71em')
        .attr('text-anchor', 'end')
        .text($(self.dataselection_name).val() +' [' + unit_disp  +']');

        // Add data and line graphic to SVG
        g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 2)
        .attr('d', line);
        //Add points
         g.append('g')
        .selectAll('dot')
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function(d) { return x(d.date) } )
        .attr("cy", function(d) { return y(d.value) } )
        .attr("r", 1)
        .attr("fill", "red")

        // Define the tip position when hovering over data
        var dx_tip = -50;
        var dy_tip = 30;

        // Add hovering tip to every point in data
        self.timedata_svg.selectAll('.dot')
        .data(data)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', function(d){ return x(d.date) + self.margin.left })
        .attr('cy', function(d){ return y(d.value) + self.margin.top })
        .attr('r', 5)
        .attr('opacity', 0.0)
        .on('mouseover', function(d){
            // Add the tip and text when hovering over a point

            var x_t = d3.select(this).attr('cx');
            var y_t = d3.select(this).attr('cy');
            var w = d3.select(this).attr('r');
            var h = d3.select(this).attr('r');
            var cx = parseInt(x_t)+parseInt(w)/2;
            var cy = parseInt(y_t)+parseInt(h)/2;
            var dx = cx+dx_tip;
            var dy = cy-dy_tip;
            var asdf = new Date(d.date);
            // Define text background rectangle
            self.timedata_svg.append('rect')
                .attr('id', 'tip_rect')
                .attr('x', parseInt(x_t)-70)
                .attr('y', parseInt(y_t)-60)
                .attr('width', 140)
                .attr('height', 40)
                .attr('fill', 'black')
                .attr('opacity', 0.7)
                .style('pointer-events','none');
            // Define text of the data to show (date)
            self.timedata_svg.append('text')
                .attr('id', 'tip_text_date')
                .text(''+asdf.getDate()+'/'+(asdf.getMonth()+1)+'/'+asdf.getFullYear()+'-'+('0' + asdf.getHours()).slice(-2)+':'+('0' + asdf.getMinutes()).slice(-2))
                .attr('text-anchor', 'end')
                .attr('x', parseInt(x_t)+68)
                .attr('y', parseInt(y_t)-45)
                .attr('fill', 'white')
                .attr('font-size', '16px')
                .style('pointer-events','none');
            // Define text of the data to show (value)
            self.timedata_svg.append('text')
                .attr('id', 'tip_text_value')
                .text(''+d.value.toFixed(3) + unit_disp)
                .attr('text-anchor', 'end')
                .attr('x', parseInt(x_t)+68)
                .attr('y', parseInt(y_t)-25)
                .attr('fill', 'white')
                .attr('font-size', '16px')
                .style('pointer-events','none');
            // Define tip line
            self.timedata_svg.append('line')
                .attr('id', 'tip_line')
                .attr('x1', x_t)
                .attr('y1', y_t)
                .attr('x2', parseInt(x_t)-70)
                .attr('y2', parseInt(y_t)-20)
                .attr('stroke-width', 1)
                .attr('stroke', 'red')
                .style('pointer-events','none');
            // Define red circle highlight
            self.timedata_svg.append('circle')
                .attr('id', 'tip_circle')
                .attr('cx', x_t)
                .attr('cy', y_t)
                .attr('r', 3)
                .attr('fill', 'red')
                .style('pointer-events','none');
            $(this).attr('class', 'focus')
        })
        .on('mouseout', function(){
            // Delete the tip and text when hovering outside data point

            d3.select('#tip_rect').remove();
            d3.select('#tip_text_date').remove();
            d3.select('#tip_text_value').remove();
            d3.select('#tip_line').remove();
            d3.select('#tip_circle').remove();
            $(this).attr('class', 'dot')
        });
    }
}
