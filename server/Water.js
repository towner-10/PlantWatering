/**
 * Darton's test module
 */

var Pump = require('./modules/Pump'); // pump
const readline = require('readline');
const Pin = require('pigpio').Gpio;

var pump = new Pump(21, 10000) // GPIO pi 21 is output

var pumpInterval;
var pumpPercent = 100;

firePump();

function firePump() {
    console.log("Water pumping at 100%")
    pump.enable();

    pumpInterval = setInterval(decrementPump, 10);

}

function decrementPump() {

    if (pumpPercent < 0) pumpPercent = 100;

    pump.intensity = ((--pumpPercent) / 100)
    console.log("Water pumping at", pumpPercent,"%");

    console.log("Pumping water");

}



//this function kills the squirting
function endPump() {
    console.log("Ending squirt");
    clearInterval(pumpInterval);
    pump.disable();
}

//setTimeout(endSquirt, 20000);

//turns on waiting for end

waitForEnd();

function waitForEnd() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question("Press any key to stop", () => {
        rl.close();
        endPump();
    })
}

function squirt(time) {
    // Check if the time is within safe range
    if (time > 2500) time = 2500;

    // Turns on the pump and wait for the timer to complete before turning off
    console.log('Pump On');
    setTimeout(() => {
        console.log('Pump Off');
    }, time);
}

//setTimeout(endPump, 10000);



/*
piGPIOTest();

function piGPIOTest() {
    
    var pin = new Pin(21, {mode:Pin.OUTPUT});
    
    new Promise((resolve, reject) => {
        pin.pwmWrite(255);
        setTimeout(resolve, 5000);
    })
    .then( () => {
        pin.pwmWrite(200);
        return new Promise((resolve, reject) => {
            setTimeout(resolve, 5000);
        });
        
    })
    .then (() => {
        pin.pwmWrite(100);
        return new Promise((resolve, reject) => {
            setTimeout(resolve, 5000);
        });
    })
    .then (() => {
        pin.pwmWrite(50);
        return new Promise((resolve, reject) => {
            setTimeout(resolve, 5000);
        });
    });
    

}
*/