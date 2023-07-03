class Googlemap{

        // Class constructor
    constructor(dom_elements, dimensions, markerLabels, sanatoLabel, googlePos){

        this.markers_len;
        this.markers = [];
        this.markersInclination = [];
        this.markerLabels = markerLabels;
        this.sanatoLabel = sanatoLabel;
        this.map;

        this.temperatureIcon;
        this.moistureIcon;
        this.accelerationIcon;
        this.antennaIcon;
        this.inclinationArrowIcon = [];

        this.googlePositions = googlePos;

        this.node_selection = dom_elements.nodeselection_name;
        this.googlemap_div = d3.select(dom_elements.googlemap_name);
        this.selected_map = dom_elements.selected_map;

        this.svgWidth = dimensions.width;
        this.svgHeight = dimensions.height;
    }

    initializeMap() {

        var self = this;

        d3.select('.googlemap-panel').style('width', self.svgWidth+'px');
        d3.select('.googlemap-panel').style('height', self.svgHeight+'px');

        d3.select('.googlemap').style('width', self.svgWidth+'px');
        d3.select('.googlemap').style('height', self.svgHeight+'px');

        var delta_offset = 0.01;

        self.map = new google.maps.Map(document.getElementsByClassName('googlemap')[0], {
            center: {lat: self.googlePositions.sanatoPos[0][0], lng: self.googlePositions.sanatoPos[0][1]},
            zoom: 17,
            zoomControl: true,
            mapTypeId: 'terrain',
            labels: true,
            scrollwheel: false,
            navigationControl: false,
            scaleControl: false,
            gestureHandling: 'cooperative',
            draggable: true,
            restriction: {
                latLngBounds:{
                    north: self.googlePositions.sanatoPos[0][0]+delta_offset,
                    south: self.googlePositions.sanatoPos[0][0]-delta_offset,
                    west: self.googlePositions.sanatoPos[0][1]-delta_offset,
                    east: self.googlePositions.sanatoPos[0][1]+delta_offset
                }
            }
        });

        self.temperatureIcon = {
            url: 'https://lixibit-statics.s3.sa-east-1.amazonaws.com/static/temperature_icon.png',
            scaledSize: new google.maps.Size(60, 60),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(32, 25)
        }

        self.batteryIcon = {
            url: 'https://lixibit-statics.s3.sa-east-1.amazonaws.com/static/battery_icon.png',
            scaledSize: new google.maps.Size(60, 60),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(32, 25)
        }

        self.moistureIcon = {
            url: 'https://lixibit-statics.s3.sa-east-1.amazonaws.com/static/moisture_icon.png',
            scaledSize: new google.maps.Size(60, 60),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(32, 15)
        }

        self.antennaIcon = {
            url: 'https://lixibit-statics.s3.sa-east-1.amazonaws.com/static/antenna_icon.png',
            scaledSize: new google.maps.Size(60, 60),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(32, 25)
        };

        self.accelerationIcon = {
            url: 'https://lixibit-statics.s3.sa-east-1.amazonaws.com/static/incline_icon.png',
            scaledSize: new google.maps.Size(60, 53),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(32, 25)
        };

        self.inclinationArrowIcon = {
            path: "M0,0 L0,4 L-0.5,4 L0,5 L0.5,4 L0,4 z",
            fillColor: 'white',
            fillOpacity: 1,
            anchor: new google.maps.Point(0,0),
            strokeWeight: 2,
            strokeColor: 'black',
            scale: 10,
            rotation: 180
        }

        var markerIcon_Stack = {
            url: 'https://lixibit-statics.s3.sa-east-1.amazonaws.com/static/antenna_icon.png',
            scaledSize: new google.maps.Size(60, 60),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(32, 65)
        };

        var markerIcon_Sanatorium = {
            url: 'https://lixibit-statics.s3.sa-east-1.amazonaws.com/static/raspberry_icon.png',
            scaledSize: new google.maps.Size(60, 60),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(32, 65),
        };

        var marker = new MarkerWithLabel({
            map: self.map,
            animation: google.maps.Animation.DROP,
            position: {
                lat: self.googlePositions.sanatoPos[0][0],
                lng: self.googlePositions.sanatoPos[0][1]
            },
            icon: markerIcon_Sanatorium,
            labelContent: self.sanatoLabel[0],
            labelAnchor: new google.maps.Point(33, 10),
            labelClass: "googlemap-marker-gateway",
            labelInBackground: true
        });

        marker.addListener('click', function() {
            self.map.setZoom(18);
            self.map.setCenter(this.position);
        });
    }

    renderMarkers(dom_elements, data, data_format, markers_len){

        var self = this;

        self.markers_len = markers_len;
        self.selected_map = dom_elements.selected_map;

        for(var i = 0; i < self.markers_len; i++){

            if(!(('marker_'+i) in self.markers)){

                var markerLatLng = new google.maps.LatLng(self.googlePositions.markerPos[i][0], self.googlePositions.markerPos[i][1]);

                self.markers['marker_'+i] = new MarkerWithLabel({
                    map: self.map,
                    animation: google.maps.Animation.DROP,
                    position: markerLatLng,
                    icon: self.temperatureIcon,
                    labelContent: self.markerLabels[i],
                    labelAnchor: new google.maps.Point(33, -40),
                    labelClass: "googlemap-marker-node",
                    labelInBackground: true
                });

                self.markers['marker_'+i].addListener('click', function() {
                    self.map.setZoom(18);
                    self.map.setCenter(this.position);
                    var sensor_index = self.markerLabels.findIndex( sensor_val => sensor_val  == this.labelContent.split('<br>')[0]);
                    $(self.node_selection).val(sensor_index);
                    $(self.node_selection).trigger('change');
                });

                self.inclinationArrowIcon['marker_'+i] = {
                    path: "M0,0 L0,4 L-0.6,4 L0,5.2 L0.6,4 L0,4 z",
                    fillColor: 'white',
                    fillOpacity: 1,
                    anchor: new google.maps.Point(0,0),
                    strokeWeight: 2,
                    strokeColor: 'black',
                    scale: 10,
                    rotation: 180
                }
            }
        }

        if (self.selected_map == 'TemperatureNode'){
            for(var i = 0; i < self.markers_len; i++){
                self.markers['marker_'+i].set("labelContent", self.markerLabels[i]+'<br>'+data.nodes['node_'+i][self.selected_map] + data_format.units[self.selected_map]);
                self.markers['marker_'+i].set("icon", self.temperatureIcon);
            }
        }
        else if (self.selected_map == 'VoltageNode'){
            for(var i = 0; i < self.markers_len; i++){
                self.markers['marker_'+i].set("labelContent", self.markerLabels[i]+'<br>'+data.nodes['node_'+i][self.selected_map] + data_format.units[self.selected_map]);
                self.markers['marker_'+i].set("icon", self.batteryIcon);
            }
        }
        else if (self.selected_map == 'MoistureNode'){
            for(var i = 0; i < self.markers_len; i++){
                self.markers['marker_'+i].set("labelContent", self.markerLabels[i]+'<br>'+data.nodes['node_'+i][self.selected_map] + data_format.units[self.selected_map]);
                self.markers['marker_'+i].set("icon", self.moistureIcon);
            }
        }
        else if (self.selected_map == 'SNRNode'){
            for(var i = 0; i < self.markers_len; i++){
                self.markers['marker_'+i].set("labelContent", self.markerLabels[i]+'<br>'+data.nodes['node_'+i][self.selected_map] + data_format.units[self.selected_map]);
                self.markers['marker_'+i].set("icon", self.antennaIcon);
            }
        }
        else if (self.selected_map == 'RSSINode'){
            for(var i = 0; i < self.markers_len; i++){
                self.markers['marker_'+i].set("labelContent", self.markerLabels[i]+'<br>'+data.nodes['node_'+i][self.selected_map] + data_format.units[self.selected_map]);
                self.markers['marker_'+i].set("icon", self.antennaIcon);
            }
        }
        else if (self.selected_map == 'AccelerationNode' || self.selected_map == 'ElevationNode' || self.selected_map == 'AzimuthNode'){
            var force;
            var elev;
            var azim;
            for(var i = 0; i < self.markers_len; i++){
                force = data.nodes['node_'+i]['AccelerationNode'];
                elev = data.nodes['node_'+i]['ElevationNode'];
                azim = data.nodes['node_'+i]['AzimuthNode'];
                var elev_rat = (elev < 60.0) ? elev/60.0 : 1.0;
                self.inclinationArrowIcon['marker_'+i] = {
                    path:   "M0,0" +
                            " L-0.3," + 4 +
                            " L-0.7," + 4 +
                            " L0," + (4 + 1.2) +
                            " L0.7," + 4 +
                            " L0.3," + 4 +
                            " z",
                    fillColor: "white",
                    fillOpacity: 1,
                    anchor: new google.maps.Point(0,0),
                    strokeWeight: 1,
                    strokeColor: 'black',
                    scale: elev_rat*10,
                    rotation: -azim
                }
                self.markers['marker_'+i].set("labelContent", self.markerLabels[i]+'<br>'+data.nodes['node_'+i][self.selected_map] + data_format.units[self.selected_map]);
                self.markers['marker_'+i].set("icon", self.inclinationArrowIcon['marker_'+i]);
            }
        }
    }
}