/**
 * Programmer: Darton Li
 * Purpose of Module: To expose a class which provides an interface for controlling a pump using PWM through GPIO
 * Methods are chainable
 * 
 * Version: 0.1.0
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

class Pump {

    /** Constructor
     * @param pinNum: the pin number
     * @param pwmFreq: pwm frequency in hz, >= 0.
     */
    constructor(pinNum, pwmFreq) {
        this.pinNum = pinNum;
        this.pwmFreq = pwmFreq;

        this.intensity = 255; //How hard to pump water (default 100%)
        this.enabled = false;
        
        this.pumpPin = new Pin(pinNum, {mode:Pin.OUTPUT}); // makes a new Pin object with which we can send commands to GPIO
        this.pumpPin.pwmFrequency(pwmFreq); //sets frequency of pwm
    }

    

    // ====================== Setters ==========================
    // Setters return the object; they are chainable

    /**
     * Sets how fast the pump runs
     * @param {} intensity: Pwm duty cycle, 0 to 1.
     * Will cap intensity between 0 and 1
     */
    set intensity(intensity) {
        if (intensity > 1) intensity = 1;
        else if (intensity < 0) intensity = 0;

        this.intensity = Math.round(intensity * 255.0);
        if (this.enabled) {
            this.pumpPin.pwmWrite(this.intensity);
        }

        return this;
    }

    /** Turns on the pump */
    enable() {
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


    // ==================== Getters ======================


    /**
     * @returns the intensity of the pump
     */
    get intensity() {
        return (this.intensity / 255.0);
    }

    /**
     * @returns The GPIO pin number associated with the pump
     */
    get pinNum()  {
        return this.pinNum;
    }

    /**
     * @returns the Pin object associated with the pump
     */
    get pinNum() {
        return this.pumpPin;
    }

    /** @returns boolean value describing whether pump is enabled or not */
    get enabled() {
        return this.enabled;
    }
}

module.exports = Pump;
