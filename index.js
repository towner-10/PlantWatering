global.SERIAL_BUS_WAIT = 2000; // how long to wait before attempting to reconnect the serial bus

const Express = require('express');
const process = require('process');
const app = Express();
const WebSocket = require('ws');
const serverPort = 80;
const wss = new WebSocket.Server({port: 443});
const Database = require('./server/utilities/database');
const Format = require('./server/utilities/format');
const db = new Database();
const SerialPort = require('serialport');
const {EventEmitter} = require('events');
const eventEmitter = new EventEmitter();
var port;

connectSerial();

function connectSerial() {
    port = new SerialPort('/dev/ttyUSB0', function (err) {
        if (err) {
            return console.log('Error: ', err.message);
        }
        else {
            port.on('data', function (data) {
                const currentTime = Date.now();
                const value = parseInt(data.toString());

                db.addPoint(value, Math.floor(currentTime / 1000));
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            'data': value,
                            'time': currentTime
                        }));
                    }
                });

                // Report new data to the pump controller
                try {
                    pumpController.setCurrent(value);
                } catch (err) {
                    console.log(err);
                }

                lastTimeSerial = Date.now();
            });
        }
    });

    setTimeout(() => {doesReconnect = false;}, 10000); // After 10 seconds, allow the waterer to try to reconnect again (if this failed);
}

var lastTimeSerial; // When did we last get data?

var pumpController;

try {
    // Simple trycatch to make sure program doesn't crash if the Pump doesn't work on current system
    const Pump = require('./server/modules/Pump');
    const pump = new Pump(21, 1000);

    console.log("Main: Enabling Pump Controller");
    const PumpController = require('./server/modules/PumpController');
    pumpController = new PumpController(0.02, 3, 100, pump, undefined, 50000, true);
    pumpController.enable();
    pumpController.setCurrent(70);
    pumpController.setTarget(70);
    
    console.log("Success!\nMain: Enabling Pump");
    pump.enable();

    // Put pump API here
    app.get('/api/water/pump', (req, res) => {
        var time = req.query.time;
        pump.squirt(time);
        res.status(200).send("Pumping for " + time + "ms");
    });

    // On close
    // SIGINT is generated on a CTRL-C exit
    process.on('SIGINT', function () {
        console.log("\n\nCleaning up GPIO...");
        pump.disable();
        console.log("Done cleaning up.");
        process.exit(1);
    });
} catch (error) {
    console.log(error);
    console.log("The pump likely doesn't work on your system");
}

var mainLoop = setInterval(loop, 1000);
var doesReconnect = false;

/**
 * A loop called every second, because there are functions that need to be done on repeat
 */
function loop() {
    let currentTime = Date.now();

    // If it's been greater than 2 seconds since we last got serial comms, try to reconnect the serial bus
    if (currentTime - lastTimeSerial > SERIAL_BUS_WAIT && !doesReconnect) {
        console.log("Serial bus disconnected! Attempting reconnect!");
        emergencyStop();
        serialReconnect();
    }

}

port.on('error', function(err) {
    console.log('Error: ', err.message)
  });

async function serialReconnect() {
    doesReconnect = true;
    setTimeout(() => {
        port.close((err) => {
            if (err) {
                console.log("Error closing port!", err.message);
            }
        });
        setTimeout(connectSerial, 30000);
    }, 1000)

}

function emergencyStop() {
    eventEmitter.emit('emergencyStop', []);
}

app.get('/api/test', (req, res) => {
    db.getPoints(Format.convertDateToTimestamp(Format.dateSecondsAgo(60)), Format.convertDateToTimestamp(Date.now())).then((data) => {
        if (data == null) return res.status(500);
        return res.status(200).json(data);
    });
});

app.use(Express.static('client'));

app.listen(serverPort, () => {
    console.log(`Listening at http://localhost:${serverPort}`);
});