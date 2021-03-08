/** Index.js
 *  By Collin Town & Darton Li
 *  
 *  Dependencies:
 *  I2C enabled with raspi-config to interface with ADS1x15 controller
 *  Express for webserver
 *  WebSocket for client <-> server communication
 *  Database & Format for data 
 *  Events for error handling throughout program
 */

global.SERIAL_BUS_WAIT = 2000; // how long to wait before attempting to reconnect the serial bus

const Express = require('express');
const app = Express();
const WebSocket = require('ws');
const serverPort = 80;
const wss = new WebSocket.Server({port: 443});
const Format = require('./server/utilities/format');
const Database = require('./server/utilities/database');
const db = new Database().getInstance();
const Raspi = require('raspi');
const I2C = require('raspi-i2c').I2C;
const ADS1x15 = require('./controllers/ADS1x15');
const {EventEmitter} = require('events');
const eventEmitter = new EventEmitter();

var lastTimeData;
var pumpController;

Raspi.init(() => {
    
    // Init Raspi-I2c
    const i2c = new I2C();
    
    // Init the ADC
    const adc = new ADS1x15({
        i2c,                                    // i2c interface
        chip: ADS1x15.chips.IC_ADS1015,         // chip model
        address: ADS1x15.address.ADDRESS_0x48,  // i2c address on the bus
        
        // Defaults for future readings
        pga: ADS1x15.pga.PGA_4_096V,            // power-gain-amplifier range
        sps: ADS1x15.spsADS1015.SPS_250         // data rate (samples per second)
    });

    function readI2CData() {
        setTimeout(() => {
            adc.getLastReading((err, value, volts) => {
                if (err) {
                    emergencyStop();
                    console.error('Failed to fetch value from ADC', err);
                } else {
                    const currentTime = Date.now();
                    value = Format.map(value, 550, 10, 0, 100);

                    db.addPoint(value, Math.floor(currentTime / 1000));

                    sendToClients({'type': 'stats', 'data': value, 'time': currentTime});

                    readI2CData();

                    pumpController.setCurrent(value);

                    lastTimeData = Date.now();
                }

                
            });
        }, 1000);
    }
    
    adc.startContinuousChannel(ADS1x15.channel.CHANNEL_0, (err, value, volts) => {
        if (err) {
            emergencyStop();
            console.error('Failed to fetch value from ADC', err);
        } else {
            readI2CData();
        }
    });
});

try {
    // Simple trycatch to make sure program doesn't crash if the Pump doesn't work on current system
    const Pump = require('./server/modules/Pump');
    const pump = new Pump(21, 1000);

    console.log("Main: Enabling Pump Controller");
    const PumpController = require('./server/modules/PumpController');
    pumpController = new PumpController(0.02, 3, 100, pump, undefined, 10000, eventEmitter, false);
    pumpController.enable();
    pumpController.setCurrent(40);
    pumpController.setTarget(40);
    
    console.log("Success!\nMain: Enabling Pump");
    pump.enable();

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

/**
 * Sends JSON data to all clients
 * @param {Object} data JSON unstringified
 */
function sendToClients(data) {
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

//set up comms between server & client
wss.on('connection', function connection(ws) {

    //Listeners
    ws.on('message', (data) => {

        let json = JSON.parse(data);
        
        switch(json.type) {
            case 'moisture update':
                let value = json.data;
                pumpController.setTarget(value);
                sendToClients({'type': 'moisture update', 'data': value});
                break;
        }
        
    });
});

/* ----------------------------- WebServer Stuff ---------------------------- */

app.use(Express.static('client'));

app.listen(serverPort, () => {
    console.log(`Listening at http://localhost:${serverPort}`);
});

function emergencyStop() {
    eventEmitter.emit('emergencyStop', {});
}