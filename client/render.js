var chart;
var config = {
    type: 'line',
    data: {
        datasets: [{
            label: 'Current Reading',
            data: [],
            borderColor: `$blue`,
            backgroundColor: `$blue-300`,
        }],
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        title: {
            display: true,
            text: 'Moisture Reading'
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
                    labelString: 'Reading'
                },
                ticks: {
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }]
        }
    }
}

const slider = document.getElementById('timeSelector');
const bubble = document.getElementById("timeSelectorBubble"); //bubbles stolen from https://css-tricks.com/value-bubbles-for-range-inputs/
var timeScale = 60; // how many of config.scales.xAxes.time.unit to count

onload();
initSlider();

function onload() {
    var ctx = document.getElementById('myChart').getContext('2d');
    chart = new Chart(ctx, config);
};

async function initSlider() {
    
    slider.addEventListener("input", async () => {
        timeScale = slider.value;
        setBubble(slider, bubble);
    });
      
    function setBubble(range, bubble) {
        const val = range.value;
        const min = range.min ? range.min : 0;
        const max = range.max ? range.max : 100;
        const newVal = Number(((val - min) * 100) / (max - min));
        bubble.innerHTML = val;
        
        // Sorta magic numbers based on size of the native UI thumb
        bubble.style.left = newVal + "%";
    }
}



webSocket = new WebSocket(`ws://${window.location.hostname}:443`);
webSocket.onopen = function() {
    console.log('Connection opened');
};
webSocket.onmessage = function(event) {
    json = JSON.parse(event.data);
    stat = parseInt(json.data);
    time = new Date(json.time);

    config.data.datasets[0].data.push({
        x: time,
        y: stat
    });
   
    
    if (((time - config.data.datasets[0].data[0].x).valueOf() / 1000) > timeScale) {
    //if (config.data.datasets[0].data.length > 60) {
        config.data.datasets[0].data.shift();
    //}
    }
    chart.update();
};
webSocket.onclose = function() {
    console.log('Connection closed');
}