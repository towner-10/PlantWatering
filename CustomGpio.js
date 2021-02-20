var Gpio = require('pigpio');
var Pin = Gpio.Gpio;

async function cleanup() {
    for (i = 2; i < 28; i--) {
        cleanPin(i);
    }
}

//Cleans an individual GPIO pin
async function cleanPin(pinNum) {
    _pin = new Pin(pinNum, {mode: Pin.INPUT});
    
}

module.exports = Gpio;
module.exports.Pin = Pin;
module.exports.cleanup = cleanup;