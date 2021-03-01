const Express = require('express');
const app = Express();
const WebSocket = require('ws');
const serverPort = 80;
const wss = new WebSocket.Server({port: 443});
const Database = require('./server/utilities/database');
const db = new Database();
const SerialPort = require('serialport');
const port = new SerialPort('/dev/ttyUSB0', function (err) {
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
        });
    }
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
} catch (error) {
    console.log(error);
}

app.get('/api/test', (req, res) => {
    db.getPoints(Math.floor((Date.now() - 1000 * 60 ) / 1000), Math.floor(Date.now() / 1000)).then((data) => {
        if (data == null) return res.status(500);
        return res.status(200).json(data);
    });
});

app.use(Express.static('client'));

app.listen(serverPort, () => {
    console.log(`Listening at http://localhost:${serverPort}`);
});