/**
 * Programmer: Darton Li
 * Purpose of Module: To expose a class which provides an interface for controlling a pump using PWM through GPIO
 * Methods are chainable
 * 
 * Version: 0.2.0
 * Release Date: Feb 19, 2021
 * 
 * Dependencies:
 * module 'pigpio'
 * pigpio for Node.js is a wrapper for the pigpio c library. https://github.com/fivdi/pigpio
 * If the c library is outdated or is not available, run 
 * > sudo apt-get update
 * > sudo apt-get install pigpio
 */

var Gpio = require('pigpio'); // import onoff as gpio
var Pin = Gpio.Gpio;
//var process = require('process'); // So that VS Code can use autofill

module.exports = class Pump {

    /** Constructor
     * @param pinNum: the pin number
     * @param pwmFreq: pwm frequency in hz, >= 0.
     */

    constructor(pinNum, pwmFreq) {
        this.pinNum = pinNum;
        this.pwmFreq = pwmFreq;

        this.intensity = 255; //How hard to pump water (default 100%)
        this.enabled = false;
        process.on('SIGINT', this.onClose);
        this.pumpPin = new Pin(pinNum, {mode: Gpio.INPUT});
        this.pumpPin = new Pin(pinNum, {mode: Gpio.OUTPUT}); // makes a new Pin object with which we can send commands to GPIO
        this.pumpPin.pwmFrequency(this.pwmFreq); //sets frequency of pwm
    }

    /** Turns on the pump */
    enable() {
        //console.log("Pumping", this.intensity);
        //writes pwm between 0 and 255
        this.pumpPin.pwmWrite(this.intensity);
        this.enabled = true;

        return this;
    }

    /** Turns off the pump */
    disable() {
        this.pumpPin.digitalWrite(0);
        this.enabled = false;
        
        return this;
    }

    /** Squirts the pump for a determined time */
    squirt(time) {
        // Check if the time is within safe range
        if (time > 2500) time = 2500;
    
        // Turns on the pump and wait for the timer to complete before turning off
        console.log('Squirting');
        this.enable();
        setTimeout(() => {
            console.log('Done Squirting');
            this.disable();
        }, time);
    }


    /**
     * Sets how fast the pump runs
     * @param {} intensity: Pwm duty cycle, 0 to 1.
     * Will cap intensity between 0 and 1
     */
    setIntensity(intensity) {
        if (intensity > 1) intensity = 1;
        else if (intensity < 0) intensity = 0;

        intensity = Math.round(intensity * 255.0);

        this.intensity = intensity;
        this.pumpPin.pwmWrite(intensity);
    }

    onClose() {
        console.log("Cleaning pin", this.pinNum);
        this.pumpPin.mode({Mode: GPIO.INPUT});
    }
}