/**
 * Programmer: Darton Li
 * Purpose of Module: To expose a class which controls water levels, without a PID loop.
 * 
 * Version: 0.4.0
 * Release Date: Feb 19, 2021
 * 
 * Dependencies:
 * 
 */

const PUMP_MAX = 0.5 * 60 * 1000; //how much millis you're allowed to pump before stopping for fear of error
const PUMP_MILLIS = 1000; //how many millis you pump for each pump

 /* =============================== Exposed Class ===================================== */
class PumpController {



    /* =============================== Constructor, Obviously ======================= */

    /** Constructor:
     * @param P: a number that determines how much the proportional gain will be
     * @param requiredError: A number to determine the absolute value the error must be greater than to activate
     * @param checkPeriod: How often, in ms, to call the checking function
     * @param pump: The pump which belongs to the PumpController.
     * @param pollFunction: The function for the controller to poll to see the current state of the sensor. Set to undefined to turn off polling.
     * @param squirtPeriod: How often, in ms, to try to squirt. Only applies if pwm is false.
     * @param pwm: If this is running off a relay, use this.
     */
    constructor(P, requiredError, checkPeriod, pump, pollFunction, squirtPeriod, pwm) {
        this.target = 0;
        this.current = 0;
        this.enabled = false;
        this.__activated = false;

        this.P = P;
        
        this.pump = pump;
        this.requiredError = requiredError;
        this.pollFunction = pollFunction;
        this.error = 0;
        this.halted = false;

        this.pwm = pwm;
        this.timesPumped = 0;
        this.checkPeriod = checkPeriod;

        this.lastTimeSerial = 0;

        //make sure pump starts off
        pump.setIntensity(0);

        //interval
        this.checkerFunction = setInterval(this.check.bind(this), checkPeriod);
        if (!pwm) this.squirtFunction = setInterval(this.squirt.bind(this), squirtPeriod);

        const {EventEmitter} = require('events');

        this.listener = new EventEmitter();
        this.listener.on("emergencyStop", function estop() {
            console.log("Pump Controller doing an e-stop");
            this.emergencyStop()}); //if index.js encounters an error, do this
    }

    /**
     * To be used with relays
     * If the checker function has found that it doesn't have enough water, squirt will run periodically. Otherwise, it will just return.
     */
    squirt() {
        if (this.__activated) {
            if (this.halted) return;

            if (this.timesPumped > PUMP_MAX && !this.halted) {
                console.log("The pump controller suspects the device is no longer functioning. Maybe the pipe fell out or the sensor got waterlogged?",
                "The pump controller will no longer deliver water until the sensor detects that the plant no longer needs water one time.");
                this.emergencyStop();
                return;
            }

            this.pump.setIntensity(1);
            this.timesPumped += PUMP_MILLIS;

            //Turn off the pump after long enough
            setTimeout(function() {
                this.pump.setIntensity(0);
            }.bind(this), PUMP_MILLIS);
        } else {
            this.pump.setIntensity(0);
        }
    }

    emergencyStop() {
        if (this.halted == false) {
            console.error("The pump has been e-stopped!");
            this.pump.setIntensity(0);
            this.halted = true;
        }
        return;
    }

    check() {
        if (!this.enabled) return;
        if (this.pollFunction != undefined) this.current = this.pollFunction();
        
        this.error = this.target - this.current;
        //console.log("error =", this.error);

        if (this.timesPumped > PUMP_MAX && this.halted == false) {
            console.log("The pump controller suspects the device is no longer functioning. Maybe the pipe fell out or the sensor got waterlogged?",
            "The pump controller will no longer deliver water until the sensor detects that the plant no longer needs water one time.");
            this.emergencyStop();
        }

        if (this.error > this.requiredError) {

            if (this.halted) return;

            //If we're starting watering the first time, report it.
            if (!this.__activated) {
                console.log("Watering plant!");
            }
            this.__activated = true;
            
    
            //if we're using pwm
            if (this.pwm) {
                let intensity = 1; // start the intensity at 1 for the first half-second to kick the motor
                if (this.timesPumped > 500) {
                    intensity = this.error * this.P;
                } 
        
                
                //console.log("Intensity", intensity);
                
                this.pump.setIntensity(1);
                //keep a log of how much we've been pumping (in ms at 100%)
                this.timesPumped += (intensity > 1 ? 1 : intensity) * this.checkPeriod;
            }
        } 
        else if (this.__activated) { // turn off the water if it's enough
            console.log("Plant has enough water!");
            this.halted = false;
            this.timesPumped = 0;
            this.pump.setIntensity(0);
            this.__activated = false;
        }
    }

    /** Kills the current loop */
    killLoop() {
        clearInterval(checkerFunction);
        if (this.squirtFunction != undefined) clearInterval(this.squirtFunction);
    }

    /** Turns the loop on */
    enable() {
        this.enabled = true;
    }

    /** Turns the loop off */
    disable() {
        this.enabled = false;
    }


    /** Stops squirting */
    deactivate() {
        console.log("Plant has enough water!");
        this.pump.setIntensity(0);
        this.__activated = false;
        this.timesPumped = 0;
    }

    /** Informs the loop of the current state of the sensor 
     * @param current: must be numeric
    */
    setCurrent(current) {
        if (current < 0) current = 0;
        this.current = current;
        if (current > this.target && this.__activated) {
            console.log("Plant has enough water!");
            this.pump.setIntensity(0);
            this.__activated = false;
        }

        this.lastTimeUpdated = Date.now();
    }

    setTarget(target) {
        this.target = target;
    }
}

module.exports = PumpController;