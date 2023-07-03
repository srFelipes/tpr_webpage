$(document).ready(function(){

    var jsonResp;

    // Data format (texts and units)
    var data_format = {
        node : [],
        units : {}
    };

    // Elements quantity
    var elements = {
        meas : { x : 3, y : 3},
        interp : { x : 30, y : 30}
    };

    // Visualization dimensions
    var dimensions = {
        width : 0,
        height : 0
    };

    // Visualization margin
    var margin = {
        top: 50,
        right: 30,
        bottom: 50,
        left: 80
    };

    // Data arrays
    var data = {
        nodes : {},
        map : {}
    };

    // Timeseries dates handler
    var date = {
        from : new Date(),
        to : new Date()
    };

    // Main HTML visualization elements
    var dom_elements = {
        googlemap_name : '.googlemap',
        heatmap_name : '.heatmap',
        timedata_name : '.timemap',
        voltage_name : '.voltage_data',
        calibration_name : '.calibration-scale',
        nodeselection_name : '.node-selection',
        dataselection_name : '.selected_map',
        selected_map : 'TemperatureNode',
        map_series_selection : 'Google'
    };

    var sanatoPos = [];
    var sanatoLabel = [];

    var markerPos =  [];

    // Googlemaps markers
    var markerLabels = [];
    var markerLength;

    initial_data();

    var googlePos = {sanatoPos : sanatoPos, markerPos : markerPos};

    // Dimensions data
    var tmp_height = d3.select('.data-container').node().getBoundingClientRect();
    var tmp_mapdata = d3.select('.mapdata-panel').node().getBoundingClientRect();
    var tmp_googlemap = d3.select('.googlemap-panel').node().getBoundingClientRect();
    var tmp_timedata = d3.select('.mid-panel').node().getBoundingClientRect();

    // Initialize Googlemap
    dimensions.width = tmp_timedata.right - tmp_timedata.left;
    dimensions.height = tmp_height.bottom - tmp_height.top;

    let googlemap = new Googlemap(dom_elements, dimensions, markerLabels, sanatoLabel, googlePos);
    googlemap.initializeMap();

    // Initialize Heatmap
    let heatmap = new Heatmap(dom_elements, dimensions, elements);
    heatmap.initializeMap(data, data_format);

    // Initialize Timedata
    dimensions.width = tmp_timedata.right - tmp_timedata.left;

    let timeserie = new Timedata(dom_elements, dimensions, margin);
    timeserie.initializeSerie(data, data_format);

    $('#download-button').on('click', function(){
        csv_data();
    });

    $('.voltage_data').on('change', function(){
        get_data(dom_elements, date, data, data_format, heatmap, timeserie);
    });

    // Change between Map and Timedata on click
    $('.nav_data').on('click', function(){
        if($(this).val() == 'googlemap'){
            $('.mapdata-panel').css({display: 'none'});
            $('.googlemap-panel').css({display: 'block'});
            $('.timedata-panel').css({display: 'none'});
            dom_elements.map_series_selection = 'Google';
        }
        else if($(this).val() == 'heatmap'){
            $('.mapdata-panel').css({display: 'block'});
            $('.googlemap-panel').css({display: 'none'});
            $('.timedata-panel').css({display: 'none'});
            dom_elements.map_series_selection = 'Map';
        }
        else if($(this).val() == 'timedata'){
            $('.mapdata-panel').css({display: 'none'});
            $('.googlemap-panel').css({display: 'none'});
            $('.timedata-panel').css({display: 'block'});
            dom_elements.map_series_selection = 'Serie';
        }
        get_data(dom_elements, date, data, data_format, heatmap, timeserie);
    });

    // Change between data type (Moisture, Temperature, etc)
    $(dom_elements.dataselection_name).on('change', function(){
        dom_elements.selected_map = $(this).val() + 'Node';
        get_data(dom_elements, date, data, data_format, heatmap, timeserie);
    });

    // Change between node number
    $(dom_elements.nodeselection_name).on('change', function(){
        j = $(dom_elements.nodeselection_name).val();
        for(var i = 0; i < data_format.node.length; i++){
            $('#'+data_format.node[i]).text(data.nodes['node_'+j][data_format.node[i]] + data_format.units[data_format.node[i]]);
        }
        get_data(dom_elements, date, data, data_format, heatmap, timeserie);
    });

    get_data();

    select_dates();

    // Makes an HTML query to get the data from the webserver
    function initial_data(){

        var x = new XMLHttpRequest();

        x.onreadystatechange = function(){
            if(x.status === 200 && x.readyState === 4) {
                jsonResp = JSON.parse(x.responseText);
                var nodes_strings = jsonResp['strings'];
                var units_strings = jsonResp['units'];
                for(var j = 0; j < Object.keys(nodes_strings).length; j++){
                    data_format.node.push(nodes_strings[j+'']);
                }
                for(var j = 0; j < Object.keys(nodes_strings).length; j++){
                    data_format.units[nodes_strings[j+'']] = units_strings[j+''];
                }
                var nodes_length = jsonResp['nodes_length'];
                markerLength = nodes_length;
                for(var j = 0; j < nodes_length; j++){
                    markerPos.push([parseFloat(jsonResp['node_'+j]['coordinates']['latitude']), parseFloat(jsonResp['node_'+j]['coordinates']['longitude'])])
                    markerLabels.push(jsonResp['node_'+j]['name'])
                    $(dom_elements.nodeselection_name).append($('<option>', {
                        value: j,
                        text: jsonResp['node_'+j]['name']
                    }));
                }
                sanatoPos.push([parseFloat(jsonResp['gateway']['coordinates']['latitude']), parseFloat(jsonResp['gateway']['coordinates']['longitude'])])
                sanatoLabel.push(jsonResp['gateway']['name'])
            }
        }
        x.open('GET', window.location.pathname + '/init_query', async = false);
        x.send();
    };

    // Makes an HTML query to get the data from the webserver
    function get_data(){

        var x = new XMLHttpRequest();

        x.onreadystatechange = function(){
            if(x.status === 200 && x.readyState === 4) {
                jsonResp = JSON.parse(x.responseText);
                var nodes_strings = jsonResp['strings'];
                var nodes_length = jsonResp['nodes_length'];
                data.map = jsonResp['map_data'];
                for(var j = 0; j < nodes_length; j++){
                    data.nodes['node_'+j] = jsonResp['node_'+j];
                    for(var i = 0; i < data_format.node.length - 2; i++){
                        data.nodes['node_'+j][data_format.node[i]] = data.nodes['node_'+j][data_format.node[i]].toFixed(3)
                    }
                    if(j==$(dom_elements.nodeselection_name).val()){
                        for(var i = 0; i < data_format.node.length; i++){
                            element_id = '#'+data_format.node[i];
                            $(element_id).text(data.nodes['node_'+j][data_format.node[i]] + data_format.units[data_format.node[i]]);
                        }
                    }
                }
                if(dom_elements.map_series_selection=='Google'){
                    googlemap.renderMarkers(dom_elements, data, data_format, nodes_length);
                }
                else if(dom_elements.map_series_selection=='Map'){
                    heatmap.renderColor(dom_elements, data);
                }
                else if(dom_elements.map_series_selection=='Serie'){
                    timeserie.drawChart(dom_elements, jsonResp['time_data'], data_format);
                }
            }
        }
        x.open('GET', window.location.pathname
                                     + '/data_query?' + 'interp=' + dom_elements.selected_map
                                     + '&map=' + dom_elements.map_series_selection
                                     + '&node_n=' + $(dom_elements.nodeselection_name).val()
                                     + '&volt_disp=' + $('.voltage_data').is(':checked')
                                     + '&init_date=' +  date.from.getDate() + '/' + (date.from.getMonth()+1) + '/' + date.from.getFullYear()
                                     + '&finish_date=' + date.to.getDate() + '/' + (date.to.getMonth()+1) + '/' + date.to.getFullYear(), true);
        x.send();
    };

    // Makes an HTML query to get the data from the webserver
    function csv_data(){

        var x = new XMLHttpRequest();

        x.onreadystatechange = function(){
            if(x.status === 200 && x.readyState === 4) {
            }
        }
        window.location.href = window.location.pathname + '/csv_query?'
                                     + 'interp=' + dom_elements.selected_map
                                     + '&map=' + dom_elements.map_series_selection
                                     + '&node_n=' + $(dom_elements.nodeselection_name).val()
                                     + '&volt_disp=' + $('.voltage_data').is(':checked')
                                     + '&init_date=' +  date.from.getDate() + '/' + (date.from.getMonth()+1) + '/' + date.from.getFullYear()
                                     + '&finish_date=' + date.to.getDate() + '/' + (date.to.getMonth()+1) + '/' + date.to.getFullYear();
    };

    // Routine to display and select the dates of the timeseries data
    function select_dates() {
        var dateFormat = 'dd/mm/yy';

        var from = $('#from')
        .datepicker({
            defaultDate: '-4d',
            changeMonth: true,
            numberOfMonths: 1
        })
        .on('change', function(){
            to.datepicker('option', 'minDate', getDateDatePicker(this, 0, 'to'));
            to.datepicker('option', 'maxDate', getDateDatePicker(this, 4, 'to'));
            $(this).datepicker('option', 'minDate', null);
            $(this).datepicker('option', 'maxDate', 0);
            date.from = new Date(this.value);
            date.to = setDateDatePicker($('#to').datepicker('getDate'));
            get_data();
        });

         $('#from').datepicker('setDate', new Date());

        var to = $('#to').datepicker({
            defaultDate: '0d',
            changeMonth: true,
            numberOfMonths: 1,
            maxDate: 0
        })
        .on('change', function(){
            from.datepicker('option', 'maxDate', getDateDatePicker(this,  0, 'from'));
            from.datepicker('option', 'minDate', getDateDatePicker(this, -4, 'from'));
            $(this).datepicker('option', 'minDate', null);
            $(this).datepicker('option', 'maxDate', 0);
            date.from = setDateDatePicker($('#from').datepicker('getDate'))
            date.to = new Date(this.value)
            get_data();
        });

        $('#to').datepicker('setDate', new Date());
     
        function getDateDatePicker(element, diff, opt){
            var date_out;
            var date_tmp;
            var date_tmp_aux;
            var date_tmp_out;
            try{
                date_tmp_aux = new Date();
                date_tmp = new Date(element.value);
                date_tmp.setDate(date_tmp.getDate() + parseInt(diff));
                if(opt == 'to'){
                    if(date_tmp > date_tmp_aux){
                        date_tmp_out = new Date(date_tmp_aux);
                    }
                    else{
                        date_tmp_out = new Date(date_tmp);
                    }
                }
                else{
                    date_tmp_out = date_tmp;
                }
                date_out = $.datepicker.parseDate(dateFormat,  date_tmp_out.getDate() + '/' + (date_tmp_out.getMonth()+1) + '/' + date_tmp_out.getFullYear());
            } catch(error) {
                date_out = null;
            }
            return date_out;
        }

        function setDateDatePicker(datetime){
            date_out = $.datepicker.parseDate(dateFormat,  datetime.getDate() + '/' + (datetime.getMonth()+1) + '/' + datetime.getFullYear());
            return date_out;
        }
    };
});

function initMap(){};
