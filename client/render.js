const maxDataPointElements = 2400;
var timeScale = 60; // how many of config.scales.xAxes.time.unit to count
const maxGraphShownDataPoints = 256; // Show this many data points before beginning to smooth
// TODO: Add in curve averaging
// TODO: Add in recovering data after loss of connection
var moisture = 60;
var globalDataPoints = [];
var slider;
var bubble;
var bubble2;
var enableSwitch;
var chart;
var successToast;
var errorToast;
var webSocket;

// Keep track of disconnections
var lastTimeConnected = Date.now() / 1000;

// enum describing types of statistics
const StatTypes = {
    MOISTURE: 'MOISTURE',
    PUMP: 'PUMP'
} 
Object.freeze(StatTypes);

var config = {
    type: 'line',
    data: {
        datasets: [{
            label: 'Current Reading',
            data: [],
            borderColor: `#0275d8`,
            backgroundColor: `#0275d8`,
        }],
    },
    options: {
        title: {
            display: false,
            text: 'Moisture Reading'
        },
        legend: {
            display: false
        },
        maintainAspectRatio: false,
        scales: {
            xAxes: [{
                type: 'time',
                display: true,
                scaleLabel: {
                    display: false,
                    labelString: 'Time'
                },
                time: {
                    unit: 'second'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: false,
                    labelString: 'Reading (%)'
                },
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }]
        }
    }
}

window.addEventListener('load', (event) => {
    const ctx = document.getElementById('myChart').getContext('2d');

    enableSwitch = document.getElementById("enableSwitch");
    enableSwitch.addEventListener("input", async () => {
        sendMessage({'type': 'enable', 'value': enableSwitch.checked});
    })


    bubble = document.getElementById("timeSelectorBubble"); //bubbles stolen from https://css-tricks.com/value-bubbles-for-range-inputs/
    bubble.value = timeScale;

    slider = document.getElementById('timeSelector');
    slider.addEventListener("input", async () => {
        timeScale = slider.value;
        
        const val = slider.value;
        const min = slider.min ? slider.min : 0;
        const max = slider.max ? slider.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        bubble.value = val;
        
        // Sorta magic numbers based on size of the native UI thumb
        bubble.style.left = newVal + "%";

        // Request for historical data if data on dash is not enough
        let startTime = Date.now() * 0.001 - timeScale; //What time we should start at
        let earliestTime = globalDataPoints[0].x.getTime() / 1000 // The earliest data point we have

        // Check if the current time in the global data point cache is enough
        if (earliestTime > startTime) {
            console.log("We're requesting historical data");
            // If not, request the historical data over the interval required
            requestHistoricalData(StatTypes.MOISTURE, startTime, earliestTime - 1);
        }
    });


    moistureSelector = document.getElementById('moistureSelector');
    moistureSelector.addEventListener("input", async () => {
        const val = moistureSelector.value;
        bubble2.value = val;
        bubble2.style.left = val + "%";

        sendMessage({
            'type': 'moisture update',
            'data': val
        });
    });

    bubble2 = document.getElementById("moistureSelectorBubble");
    bubble2.value = moisture;

    chart = new Chart(ctx, config);

    // Create the Toast objects
    successToast = new bootstrap.Toast(document.getElementById('successToast'), {
        animation: true,
        autoHide: true,
        delay: 2000
    });
    errorToast = new bootstrap.Toast(document.getElementById('errorToast'), {
        animation: true
    });
    
    // Connect to the WebSocket and create listeners
    connect();
});

function connect() {
    webSocket = new WebSocket(`ws://${window.location.hostname}:443`);

    webSocket.onopen = function() {
        successToast.show();
        console.log('Connection opened');

        // Get all data since last disconnection (defaults to last second data)
        requestHistoricalData(StatTypes.MOISTURE, lastTimeConnected, Date.now() / 1000);
    };
    
    webSocket.onmessage = function(event) {
        json = JSON.parse(event.data);
        type = json.type;

        //differentiate between different types of comms
        switch (type) {
            case 'stats':
                stat = parseInt(json.data);
                time = new Date(json.time);
            
                globalDataPoints.push({
                    x: time,
                    y: stat
                });
                

                while (globalDataPoints.length > maxDataPointElements) globalDataPoints.shift();
    
                config.data.datasets[0].data = globalDataPoints.filter((value) => {
                    return (Math.abs(time - value.x) / 1000) < timeScale; // filter out the ones that are after the timescale requested in seconds
                });
    
                chart.update();
                break;
            
            case 'batch stats':
                console.info("Received historical data from server.");
                let stats = json.data.map((element) => {
                    return {
                        x: new Date(element.time * 1000), 
                        y: parseInt(element.data)
                    }
                })

                globalDataPoints = globalDataPoints.concat(stats);
                globalDataPoints.sort((a,b) => {
                    return a.x > b.x;
                })

            
                while (globalDataPoints.length > maxDataPointElements) globalDataPoints.shift();
    
                config.data.datasets[0].data = globalDataPoints.filter((value) => {
                    return (Math.abs(new Date(Date.now) - value.x) / 1000) < timeScale; // filter out the ones that are after the timescale requested in seconds
                })
                .filter((element, index, self) => { // Filter out any duplicates
                    return index === self.findIndex(obj => {
                        return obj.x === element.x;
                      });
                });

                
    
                chart.update();
                break;

            case 'moisture update':
                moisture = parseInt(json.data);
                bubble2.value = moisture;
                moistureSelector.value = moisture;
                console.info(`Received moisture update from server: New moisture: ${moisture}`);
                break;
            
            case 'enable':
                enableSwitch.value = json.value;
                break;
        }
    };
    
    webSocket.onclose = function() {
        errorToast.show();
        console.log('Connection closed');
        lastTimeConnected = Date.now() / 1000;
    }
}

/** Function which condenses websocket calls down 
 * @param {Object} data Data to send
*/
function sendMessage(data) {
    try {
        console.log(data);
        webSocket.send(JSON.stringify(data));
    } catch (err) {
        console.error(err);
    }
}

/**
 * Requests a set of historical data. All times are in seconds since UNIX epoch.
 * @param {statType} statType - Which type of stat
 * @param {Number} from - Millis to request from (including this value)
 * @param {Number} to - Millis to request to (including this value)
 */
function requestHistoricalData(statType, from, to) {
    sendMessage({
        'type': 'historical data request',
        'statType': statType,
        'fromTime': from,
        'toTime': to
    });
}


/**
 * Sets the chart's data array and renders it.
 * If there's too much data, the data points are averaged out until there is not too much data.
 * @param {Array} data 
 */
function updateChartData(data) {
    config.data.datasets[0].data
}