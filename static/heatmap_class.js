// Map class for display
class Heatmap{

    // Class constructor
    constructor(dom_elements, dimensions, elements){

        this.heatmap_svg = d3.select(dom_elements.heatmap_name);
        this.calibration_svg = d3.select(dom_elements.calibration_name);
        this.selected_map = dom_elements.selected_map;

        this.svgWidth = dimensions.width;
        this.svgHeight = dimensions.height;

        // Define the elements quantity
        this.x_elements = elements.meas.x;
        this.y_elements = elements.meas.y;

        // Define the interpolation elements quantity
        this.x_interp = elements.interp.x;
        this.y_interp = elements.interp.y;
    }

    // Initialize color map dimensions and position
    initializeMap(data, data_format){

        // Save object (Color map) instance
        var self = this;

        // Set SVG Map dimensions
        d3.select('.mapdata-panel').style('width', self.svgWidth+'px');
        d3.select('.mapdata-panel').style('height', self.svgHeight+'px');

        d3.select('.mapdata').style('width', self.svgWidth+'px');
        d3.select('.mapdata').style('height', self.svgHeight+'px');

        self.heatmap_svg.attr('width', this.svgWidth);
        self.heatmap_svg.attr('height', this.svgHeight);

        // Used for calibration rectangle SVG definitions
        var defs = self.calibration_svg.append('defs');

        // Normal color gradient for color map scale
        var gradient = defs.append('linearGradient')
            .attr('id', 'svgGradient_normal');

        // Define the gradual change in color
        for(var i = 0; i <= 100; i += 5){
            gradient.append('stop')
            .attr('class', 'stop-' + i)
            .attr('offset', i + '%')
            .attr('stop-color', d3.interpolateSpectral(i/100))
            .attr('stop-opacity', 1);
        }

        // Inverted color gradient for color map scale
        var gradient = defs.append('linearGradient')
            .attr('id', 'svgGradient_inverted');

        // Define the gradual change in color
        for(var i = 0; i <= 100; i += 5){
            gradient.append('stop')
            .attr('class', 'stop-' + i)
            .attr('offset', i + '%')
            .attr('stop-color', self.invert_scheme(i/100))
            .attr('stop-opacity', 1);
        }

        // Define the tip position when hovering over node rectangle
        var dx_tip = -50;
        var dy_tip = 30;

        // Define the minimum and maximum value of the color gradient scale
        var min_val = 1
        var max_val = 100
        $('#less').text(min_val.toFixed(2) + '')
        $('#more').text(max_val.toFixed(2) + '')

        // Set SVG gradient rectangle dimensions
        self.calibration_svg.attr('width', self.svgWidth)
        self.calibration_svg.append('rect')
            .attr('id', 'calib_rect')
            .attr('width', self.svgWidth)
            .attr('height', 20)
            .style('fill', 'url(#svgGradient)');

        // Set gradient rectangle minimum and maximum value position
        var desc = d3.select('.description');
        desc.style('width', self.svgWidth);

        // Add hovering tip and rectangles to every node rectangle
        for(var i = 0; i < this.x_elements; i++){
            for(var j = 0; j < this.y_elements; j++){
                self.heatmap_svg.append('rect')
                    .attr('id', 'node_'+(i+self.x_elements*j))
                    .attr('x', self.svgWidth*i/self.x_elements)
                    .attr('y', self.svgHeight*j/self.y_elements)
                    .attr('width', self.svgWidth/self.x_elements)
                    .attr('height', self.svgHeight/self.y_elements)
                    .attr('opacity', 0.0)
                    .on('mouseover', function(){
                        // Add the tip and rectangle when hovering inside node's rectangle

                        var x_t = $(this).attr('x');
                        var y_t = $(this).attr('y');
                        var w = $(this).attr('width');
                        var h = $(this).attr('height');
                        var cx = parseInt(x_t)+parseInt(w)/2;
                        var cy = parseInt(y_t)+parseInt(h)/2;
                        var dx = cx+dx_tip;
                        var dy = cy-dy_tip;

                        $(this).attr('opacity', 0.3);
                        // Define node's rectangle
                        self.heatmap_svg.append('rect')
                            .attr('id', 'tip_rect')
                            .attr('x', dx)
                            .attr('y', dy-20)
                            .attr('width', 100)
                            .attr('height', 25)
                            .attr('fill', 'black')
                            .attr('opacity', 0.3)
                            .style('pointer-events','none');
                        // Define node's rectangle text
                        self.heatmap_svg.append('text')
                            .attr('id', 'tip_text')
                            .text(''+data.nodes[$(this).attr('id')][self.selected_map] + data_format.units[self.selected_map])
                            .attr('text-anchor', 'end')
                            .attr('x', dx-2*dx_tip-5)
                            .attr('y', dy-2)
                            .attr('fill', 'white')
                            .attr('font-size', '16px')
                            .style('pointer-events','none');
                        // Define node's rectangle line
                        self.heatmap_svg.append('line')
                            .attr('id', 'tip_line')
                            .attr('x1', cx)
                            .attr('y1', cy)
                            .attr('x2', dx)
                            .attr('y2', dy-20+25)
                            .attr('stroke-width', 1)
                            .attr('stroke', 'red')
                            .style('pointer-events','none');
                        // Define node's rectangle middle red circle
                        self.heatmap_svg.append('circle')
                            .attr('id', 'tip_circle')
                            .attr('cx', cx)
                            .attr('cy', cy)
                            .attr('r', 3)
                            .attr('fill', 'red')
                            .style('pointer-events','none');
                    })
                    .on('mouseout', function(){
                        // Delete the tip and rectangle when hovering outside node's rectangle

                        $(this).attr('opacity', 0.0);

                        d3.select('#tip_rect').remove();
                        d3.select('#tip_text').remove();
                        d3.select('#tip_line').remove();
                        d3.select('#tip_circle').remove();
                    })
                    .on('click', function(){
                        // Select node when clicked inside node's rectangle

                        var node_id = $(this).attr('id');
                        var node_val = node_id.split('node_');

                        $(nodeselection_name).val(node_val[1]);

                        for(var i = 0; i < data_format.node.length; i++){
                            element_id = '#'+data_format.node[i];
                           $(element_id).text(data.nodes[node_id][data_format.node[i]] + data_format.units[data_format.node[i]]);
                        }
                    });
            }
        }
    }

    // Render data on color map
    renderColor(dom_elements, data){

        // Save object (Color map) instance
        var self = this;

        // Update color map selected map (Moisture, Temperature, etc)
        self.selected_map = dom_elements.selected_map;

        //
        d3.selection.prototype.moveToFront = function(){
            return this.each(function(){
                this.parentNode.appendChild(this);
            });
        };

        // Define data array
        var data_f = new Array(self.x_interp * self.y_interp);

        // Get minimum and maximum of data to display
        var min_val = data.map['z_0'];
        var max_val = data.map['z_0'];
        for(var i = 0; i < Object.keys(data.map).length; i++){
            data_f[i] = data.map['z_'+i];
            if(data.map['z_'+i] < min_val){
                min_val = data.map['z_'+i];
            }
            if(data.map['z_'+i] > max_val){
                max_val = data.map['z_'+i];
            }
        }

        // Delete old color map information
        self.heatmap_svg.selectAll('path').remove();
        self.heatmap_svg.selectAll('defs').remove();
        self.calibration_svg.selectAll('rect#calib_rect').remove();
        for(var i = 0; i < self.x_interp*self.y_interp; i++){
            self.heatmap_svg.select('rect#node_acc_'+i).remove();
            self.heatmap_svg.select('line#arrow_line_'+i).remove();
        }

        // Add calibration rectangle depending on selected map (Moisture, Temperature, etc)
        if(self.selected_map == 'MoistureNode'){
            // Minimum moisture value:  0%
            // Maximum moisture value: 60%
            min_val =  0.0;
            max_val = 60.0;

            // Use normal color gradient for moisture
            self.calibration_svg.append('rect')
                .attr('id', 'calib_rect')
                .attr('width', self.svgWidth)
                .attr('height', 20)
                .style('fill', 'url(#svgGradient_normal)');
        }
        else if(self.selected_map == 'TemperatureNode'){
            // Minimum temperature value:  0 °C
            // Maximum temperature value: 30 °C
            min_val =  0.0;
            max_val = 30.0;

            // Use inverted color gradient for temperature
            self.calibration_svg.append('rect')
                .attr('id', 'calib_rect')
                .attr('width', self.svgWidth)
                .attr('height', 20)
                .style('fill', 'url(#svgGradient_inverted)');
        }
        else if(self.selected_map == 'AccelerationNode' || self.selected_map == 'ElevationNode' || self.selected_map == 'AzimuthNode'){
            // Minimum acceleration value:  0 °
            // Maximum acceleration value: 60 °
            min_val =  0.0;
            max_val = 60.0;

            // Use inverted color gradient for accelerations
            self.calibration_svg.append('rect')
                .attr('id', 'calib_rect')
                .attr('width', self.svgWidth)
                .attr('height', 20)
                .style('fill', 'url(#svgGradient_inverted)');
        }

        $('#less').text(min_val.toFixed(2) + '')
        $('#more').text(max_val.toFixed(2) + '')

        // Add color map depending on selected map (Moisture, Temperature, etc)
        if(self.selected_map == 'AccelerationNode' || self.selected_map == 'ElevationNode' || self.selected_map == 'AzimuthNode'){

            var rect_w = self.svgWidth/self.x_elements;
            var rect_h = self.svgHeight/self.y_elements;
            var thresholds = d3.range(0.0, 60.0);

            // Used for color map SVG definitions
            var defs = self.heatmap_svg.append('svg:defs');

            // Define arrow for inclination display
            var marker = defs.append('svg:marker')
                .attr('id', 'arrow')
                .attr('refX', 0)
                .attr('refY', 2)
                .attr('markerWidth', 15)
                .attr('markerHeight', 15)
                .attr('markerUnits', 'strokeWidth')
                .attr('orient', 'auto')
                .attr('fill', '#000');
            marker.append('path').attr('d', "M0,0 L0,4 L6,2 z");

            // Use inverted color for accelerations color map
            var color = d3.scaleLinear()
                .domain(d3.extent(thresholds))
                .interpolate(function() { return self.invert_scheme;});

            // Make color map for accelerations
            for(var i = 0; i < self.x_elements; i++){
                for(var j = 0; j < self.y_elements; j++){

                    var force = data.nodes['node_'+(i+self.x_elements*j)]['AccelerationNode'];
                    var elev = data.nodes['node_'+(i+self.x_elements*j)]['ElevationNode'];
                    var azim = data.nodes['node_'+(i+self.x_elements*j)]['AzimuthNode'] * Math.PI/180.0;

                    // Add rectangle as color map for accelerations
                    self.heatmap_svg.append('rect')
                        .attr('id', 'node_acc_'+(i+self.x_elements*j))
                        .attr('x', rect_w*i)
                        .attr('y', rect_h*j)
                        .attr('width', rect_w)
                        .attr('height', rect_h)
                        .attr('fill', color(Math.abs(elev)))
                        .attr('opacity', '0.5');

                    // Add arrow over color map for accelerations
                    self.heatmap_svg.append('line')
                        .attr('id', 'arrow_line_'+(i+self.x_elements*j))
                        .attr('x1', rect_w*(i + 1/2))
                        .attr('y1', rect_h*(j + 1/2))
                        .attr('x2', rect_w*(i + 1/2) + elev/60 * rect_w/2 * Math.cos(azim))
                        .attr('y2', rect_h*(j + 1/2) - elev/60 * rect_h/2 * Math.sin(azim))
                        .attr('stroke-width', 3)
                        .attr('stroke', 'black')
                        .attr('marker-end', 'url(#arrow)');
                }
            }
        }
        else if(self.selected_map == 'MoistureNode'){

            function scale_tf () {
                return d3.geoTransform({
                    point: function(x, y) {
                        this.stream.point(x * self.svgWidth / self.x_interp, y  * self.svgHeight / self.y_interp);
                    }
                });
            }

            var off_th = 50.9;
            var epsilon = 0.5;
            var thresholds = d3.range(min_val, max_val);
            var thresholds2 = d3.range(off_th-epsilon, off_th+epsilon);

            // Use normal color gradient for temperature
            var color = d3.scaleLinear()
                .domain(d3.extent(thresholds))
                .interpolate(function() { return d3.interpolateSpectral; });

            // Define contour for color map
            var contours = d3.contours()
                .size([self.x_interp, self.y_interp])
                .thresholds(thresholds);

            // Define contour for flooding area
            var contours2 = d3.contours()
                .size([self.x_interp, self.y_interp])
                .thresholds(thresholds2);

            // Select path svg elements
            var path_tmp = self.heatmap_svg.selectAll('path');

            // Add data to color map
            path_tmp.data(contours(data_f))
                .enter().append('path')
                .attr('d',  d3.geoPath().projection(scale_tf()))
                .attr('fill', function(d) { return color(d.value); })
                .attr('fill-opacity', '0.3');

            // Add data to flooding area region
            path_tmp.data(contours2(data_f))
                .enter().append('path')
                .attr('d',  d3.geoPath().projection(scale_tf()))
                .attr('stroke', 'black')
                .attr('stroke-width', 5)
                .attr('fill', 'none')
                .attr('fill-opacity', '0.3');

            // Add data to flooding area blinking region
            path_tmp.data(contours2(data_f))
                .enter().append('path')
                .attr('class', 'blink_me')
                .attr('d',  d3.geoPath().projection(scale_tf()))
                .attr('stroke', 'none')
                .attr('fill', 'rgba(0, 0, 255, 0.5)');
            self.heatmap_svg.selectAll('path').attr('opacity', '0.3')
        }
        else{
            function scale_tf () {
                return d3.geoTransform({
                    point: function(x, y) {
                        this.stream.point(x * self.svgWidth / self.x_interp, y  * self.svgHeight / self.y_interp);
                    }
                });
            }

            var thresholds = d3.range(min_val, max_val);
            var color = d3.scaleLinear()
                .domain(d3.extent(thresholds))
                .interpolate(function() { return self.invert_scheme; });
            var contours = d3.contours()
                .size([self.x_interp, self.y_interp])
                .thresholds(thresholds);
            self.heatmap_svg.selectAll('path')
                .data(contours(data_f))
                .enter().append('path')
                .attr('d',  d3.geoPath().projection(scale_tf()))
                .attr('fill', function(d) { return color(d.value); })
                .attr('fill-opacity', '0.3')
                .attr('opacity', '0.3');
        }

        // Move to front if there's a tip and rectangle hovering
        for(var i = 0; i < self.x_elements*self.y_elements; i++){
            self.heatmap_svg.select('rect#node_'+i).moveToFront();
        }
        d3.select('#tip_rect').moveToFront();
        d3.select('#tip_text').moveToFront();
        d3.select('#tip_line').moveToFront();
        d3.select('#tip_circle').moveToFront();

    }

    // Inverts colors for Moisture map
    invert_scheme(color_input){
        return d3.interpolateSpectral(1 - color_input);
    };
}