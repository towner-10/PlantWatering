const maxDataPointElements = 2400;
var timeScale = 60; // how many of config.scales.xAxes.time.unit to count
const maxGraphShownDataPoints = 128; // Show this many data points before beginning to smooth
// TODO: Add in curve averaging
// TODO: Add in recovering data after loss of connection
var moisture = 60;
var globalDataPoints = [];
var slider;
var bubble;
var bubble2;
var enableSwitch;
var timeUnitSelector;
var chart;
var successToast;
var errorToast;
var webSocket;
var timeUnit = 1000;

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

    timeUnitSelector = document.getElementById("timeUnitSelector");
    timeUnitSelector.addEventListener("input", async () => {
        // Request for historical data if data on dash is not enough
        let startTime = Date.now() * 0.001 - timeScale * (timeUnit / 1000); //What time we should start at
        let earliestTime = globalDataPoints[0].x.getTime() / 1000 // The earliest data point we have

        // Check if the current time in the global data point cache is enough
        if (earliestTime > startTime) {
            console.log("We're requesting historical data");
            // If not, request the historical data over the interval required
            requestHistoricalData(StatTypes.MOISTURE, startTime, earliestTime - 1);
        }

        timeUnit = timeUnitSelector.value;
    });

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
        let startTime = Date.now() * 0.001 - timeScale * (timeUnit / 1000); //What time we should start at
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
    
    webSocket.onmessage = async function(event) {
        json = JSON.parse(event.data);
        type = json.type;

        //differentiate between different types of comms
        return new Promise(async (resolve, reject) => {
            switch (type) {
                case 'stats':
                    stat = parseInt(json.data);
                    time = new Date(json.time);
                
                    globalDataPoints.push({
                        x: time,
                        y: stat
                    });
                    

                    while (globalDataPoints.length > maxDataPointElements * timeUnit/1000) globalDataPoints.shift();
        
                    globalDataPoints.sort((a,b) => {
                        return a.x > b.x;
                    })

                    updateChartData(
                        globalDataPoints.filter((value) => {
                            return (Math.abs(time - value.x) / timeUnit) < timeScale; // filter out the ones that are after the timescale requested in seconds
                        })
                    );
        
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

                
                    while (globalDataPoints.length > maxDataPointElements* timeUnit/1000) globalDataPoints.shift();
        
                    updateChartData(globalDataPoints.filter((value) => {
                        return (Math.abs(new Date(Date.now) - value.x) / timeUnit) < timeScale; // filter out the ones that are after the timescale requested in seconds
                    })
                    .filter((element, index, self) => { // Filter out any duplicates
                        return index === self.findIndex(obj => {
                            return obj.x === element.x;
                        });
                    }));


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
        });
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
async function updateChartData(data) {
   
    /* This code was to save memory but it is more efficient to not use it than to use it
    //console.log("data", data);
    
    const minCountableDistance = 0.02; //  How small of a contribution towards the final product before we just discard the value

    //map a set of data with x points into one with maxGraphShownDataPoints
    const originalLength = data.length;

    /**
     * Generates a distance map.
     * @param {Integer} arg0 - How many values exist in this distance map 
     */
    /*
    function generateDistanceMap(arg0) {
        dmap = [];
        let increment = 1.0/(arg0-1.0);

        for (let i = 0; i < arg0; i++) {
            dmap[i] = i * increment;
        }

        return dmap;
    } 


    // map all original points to distances if current length is greater than the max length
    if (originalLength > maxGraphShownDataPoints) {
        console.info("Max length organizing");

        distanceMapOriginal = generateDistanceMap(originalLength);
        distanceMapNew = generateDistanceMap(maxGraphShownDataPoints);
    
        weightsMap = []; // What weight to assign to each point for each new point

        //console.info("distanceMapOriginal", distanceMapOriginal);
        //console.info("distanceMapNew", distanceMapNew);

        weightsMap = distanceMapNew.map((element, index, self) => {

            var totalWeight = 0.0;
            // A map of the weights between all the original points and this point
            let r1 = distanceMapOriginal.map((el2, index) => {
                let ret = {};
                ret.index = index;
                let distance = Math.abs(el2 - element);

                ret.weight = 1.0/Math.pow(distance === 0 ? 0.001 : distance,4); // Power so that big values become much bigger and small values become much smaller 
                totalWeight += ret.weight;
                return ret;
            })
            //console.log("r1", r1, totalWeight);

            let r2 = r1.map((el2) => {            // Normalize the vector so that all the weights add up to one
                el2.weight = el2.weight / totalWeight;
                return el2;
            });

            //console.log("r2", r2);
            return r2;
            
        });

        //console.info("weightsmap", weightsMap);

        data = weightsMap.map((element) => {
            let ret = {x:0,y:0};

            element.some((el2) => {
                if (el2.weight === NaN) {
                    ret = data[el2.index];
                    return true;
                }
                ret.x += data[el2.index].x.getTime() * el2.weight;
                ret.y += data[el2.index].y * el2.weight;
                //console.log("Ret +=", data[el2.index] * el2.weight);
            })

            if (typeof ret.x !== 'object') ret.x = new Date(ret.x);
            return ret;
        });
        // Process data based on the weightsMap
        console.info("It be done", data.length);
    }    
    */

    config.data.datasets[0].data = data;
    chart.update();

}