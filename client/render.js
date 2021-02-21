const maxDataPointElements = 2400;
var timeScale = 60; // how many of config.scales.xAxes.time.unit to count
var globalDataPoints = [];
var slider;
var bubble;
var chart;
var successToast;
var errorToast;

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
        responsive: true,
        maintainAspectRatio: false,
        title: {
            display: false,
            text: 'Moisture Reading'
        },
        legend: {
            display: false
        },
        scales: {
            xAxes: [{
                type: 'time',
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Time'
                },
                time: {
                    unit: 'second'
                }
            }],
            yAxes: [{
                display: true,
                scaleLabel: {
                    display: true,
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
    });

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
    };
    
    webSocket.onmessage = function(event) {
        json = JSON.parse(event.data);
        stat = parseInt(json.data);
        time = new Date(json.time);
    
        globalDataPoints.push({
            x: time,
            y: stat
        });
        
        while (globalDataPoints.length > maxDataPointElements) globalDataPoints.shift();

        config.data.datasets[0].data = globalDataPoints.filter((value) => {
            return (Math.abs(time - value.x) / 1000) < timeScale;
        });

        chart.update();
    };
    
    webSocket.onclose = function() {
        errorToast.show();
        console.log('Connection closed');
    }
}