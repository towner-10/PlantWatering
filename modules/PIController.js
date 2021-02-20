// Unused

/**
 * Programmer: Darton Li
 * Purpose of Module: To expose a class which provides an interface for PI loops
 * PI loops are controlled through Python as separate threads. Node.js is single-threaded, which makes PID loops work not as well.
 * The interface is a singleton, no sense in making too many Python vms.
 * 
 * Version: 0.1.0
 * Release Date: Feb 19, 2021
 * 
 * Dependencies:
 * Python3
 * "child_process"
 */

const { spawn } = require("child_process");


/* ========================= Child Process Initialization ============================= */
// variable to keep track of all the loops
var _loops = {};
var _hasChildProcess = true;

const _childProcess = spawn("python3 piController.py");

_childProcess.stdout.on("data", data => receiveData)

_childProcess.stderr.on("data", data => {
    console.log(`stderr: ${data}`);
});

_childProcess.on('error', (error) => {
    console.log(`error: ${error.message}`);
});

_childProcess.on("close", code => {
    console.log(`child process exited with code ${code}`);
    this._hasChildProcess = false;
});


// outwards-facing method to kill the child process

module.exports.kill = async () => {
    //TODO: send message to child process 
    terminateProcess();

    //wait for childprocess to close
        while (this._hasChildProcess) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    
}


/* =============================== Exposed Class ===================================== */
class PIController {

    /* ============================== Variables ====================================== */
    P = 0;
    I = 0;

    target = 0;  // Where you want the loop to be
    current = 0; // Where the loop is right now
    error = 0;
    integral = 0;


    // functions the loop calls to control the thing in question
    disableControl;
    enableControl;
    setIntensity;

    // variables to determine behaviour of loop
    enabled = false;
    period = 10;



    /* =============================== Constructor, Obviously ======================= */

    /** Constructor:
     * @param P: P value
     * @param I: I value
     * @param setIntensity: The function to call to change the intensity of the output
     * @param period: How often to update the output value (in ms), 0 for event-based: if there is any change at all
     */
    constructor(P, I, setIntensity, name, period) {
        this.setIntensity = setIntensity;
        this.P = P;
        this.I = I;
        this.period = period;

        createLoop(this);
    }

    /* ============================ Outward-facing Methods ========================== */

    /** Sets the target position
     * @param target: must be numeric
     */
    setTarget(target) {
        this.target = target;
        updateLoop(this);
    }

    /** Kills this current loop */
    killLoop() {
        endLoop(this);
    }

    /** Turns the loop on */
    enable() {
        this.enabled = true;
        updateLoop(this);
    }

    /** Turns the loop off */
    disable() {
        this.enabled = false;
        updateLoop(this);
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

}





/* ================================ Child process-facing Methods ===================== */

    /** Child Process Communication:
     * Communication with child processes are achieved using read and write streams.
     * When a communication is sent, it is sent like so:
     * <integer task> [task-specific args]
     * <task> can include:
     *       
        * 0: Terminate child process
        *  Args: <loop name>
        * 1: Create a loop:
        *  Args: <loop name> <number P> <number I> <number period>
        * 2: Update data:
        *  Args: <loop name> <number target> <number current> <bool on/off>
        * 3: Kill loop:
        *  Args: none

     */

     /** Creates a loop */
    function createLoop(loop) {
        //Check if loop with that name already exists
        let loops = Object.keys(this._loops).filter((instance) => {
            instance == loop.name;
        });

        if (loops.length > 0) {
            throw new Error('Loop with that name already exists!');
        }

        this._loops[loop.name] = loop;

        _childProcess.stdin.write('1 ' + loop.name + ' ' + loop.P + ' ' + loop.I + ' ' + loop.period);
    }

    /** Updates child process */    
    function updateLoop(loop) {
        _childProcess.stdin.write('2 ' + loop.name + ' ' + loop.target + ' ' + loop.current + ' ' + loop.enabled)
    }

    
    /** Tells child process to kill a specific loop
     * removes the loop in question from _loops */
    function endLoop(loop) {
        _childProcess.stdin.write('3 ' + loop.name)
    }

    /** Terminates the child process */
    function terminateProcess() {
        for (var loop in this._loops) {
            endLoop(loop);
        }

        //TODO: send termination message
        _childProcess.stdin.write('0 ')
    }

module.exports = PIController;


/* =================================== Child Process Input ===================================== */

    function receiveData(data) {

    }


