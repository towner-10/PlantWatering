/**
 * Programmer: Darton Li
 * Purpose of Module: To expose a class which controls water levels, without a PID loop.
 * 
 * Version: 0.1.0
 * Release Date: Feb 19, 2021
 * 
 * Dependencies:
 * 
 */

 /* =============================== Exposed Class ===================================== */
class PumpController {

    /* ============================== Variables ====================================== */

    P = 1;
    target = 0;  // Where you want the loop to be
    current = 0; // Where the loop is right now
    requiredError = 0; // How much the error has to be to activate


    // functions the loop calls to control the thing in question
    disableControl;
    enableControl;
    setIntensity;

    // variables to determine behaviour of loop
    enabled = false;
    period = 10;
    checkerFunction; // Function to run when changing intensity

    
    pollFunction; // Which function to poll for data
    __activated = false; // If the loop turned on
    



    /* =============================== Constructor, Obviously ======================= */

    /** Constructor:
     * @param P: a number that determines how much the proportional gain will be
     * @param requiredError: A number to determine the absolute value the error must be greater than to activate
     * @param period: How often, in ms, to call the checking function
     * @param setIntensity: The function for the controller to call to change the intensity of the output
     * @param pollFunction: The function for the controller to poll to see the current state of the sensor. Set to undefined to turn off polling.
     */
    constructor(P, requiredError, period, setIntensity, pollFunction) {
        this.P = P
        this.setIntensity = setIntensity;
        this.pollFunction = pollFunction;
        this.requiredError = requiredError;
        this.period = period;

        //interval
        this.checkerFunction = setInterval(check, period);
    }


    /* ============================ Outward-facing Methods ========================== */

    check() {
        if (!this.enabled) return;
        if (this.pollFunction != undefined) this.current = this.pollFunction();

        let error = this.target - this.current;

        if (Math.abs(error) > this.requiredError) {
            this.__activated = true;
        } else if (this.__activated) {
            this.setIntensity(0);
            this.__activated = false;
        }

        if (this.__activated) {
            this.setIntensity(error * this.P);
        }
    }

    /** Kills the current loop */
    killLoop() {
        clearInterval(checkerFunction);
    }

    /** Turns the loop on */
    enable() {
        this.enabled = true;
    }

    /** Turns the loop off */
    disable() {
        this.enabled = false;
    }

    /** Turns the loop on or off 
     * @param enabled: boolean value
    */
    set enabled(enabled) {
        this.enabled = enabled;
        updateLoop(this);
    }

    /** Informs the loop of the current state of the sensor 
     * @param current: must be numeric
    */
    set current(current) {
        this.current = current;
        updateLoop(this);
    }

    /** Sets the target position
     * @param target: must be numeric
     */
    set target(target) {
        this.target = target;
    }
}

module.exports = PumpController;