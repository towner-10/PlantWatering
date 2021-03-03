const Express = require('express');
const process = require('process');
const app = Express();
const WebSocket = require('ws');
const serverPort = 80;
const wss = new WebSocket.Server({port: 443});
const Database = require('./server/utilities/database');
const Format = require('./server/utilities/format');
const db = new Database();
const Raspi = require('raspi');
const I2C = require('raspi-i2c').I2C;
const ADS1x15 = require('./controllers/ADS1x15');
const LCD = require('./controllers/LCD');
const lcd = new LCD();

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
                    console.error('Failed to fetch value from ADC', err);
                } else {
                    const currentTime = Date.now();
                    value = Format.map(value, 550, 10, 0, 100);

                    db.addPoint(value, Math.floor(currentTime / 1000));
                    wss.clients.forEach(function each(client) {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                'data': value,
                                'time': currentTime
                            }));
                        }
                    });

                    lcd.printLines("Value:", value);
                    readI2CData();
                }
            });
        }, 1000);
    }
    
    adc.startContinuousChannel(ADS1x15.channel.CHANNEL_0, (err, value, volts) => {
        if (err) {
            console.error('Failed to fetch value from ADC', err);
        } else {
            readI2CData();
        }
    });
});

try {
    // Simple trycatch to make sure program doesn't crash if the Pump doesn't work on current system
    const Pump = require('./server/modules/Pump');
    const pump = new Pump(21, 10000);

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
        lcd.clear();
        console.log("Done cleaning up.");
        process.exit(1);
    });
} catch (error) {
    console.log(error);
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