const Express = require('express');
const app = Express();
const WebSocket = require('ws');
const serverPort = 80;
const wss = new WebSocket.Server({port: 443});
const SerialPort = require('serialport');
const port = new SerialPort('/dev/ttyUSB0', function (err) {
    if (err) {
        return console.log('Error: ', err.message);
    }
    else {
        port.on('data', function (data) {
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        'data': parseInt(data.toString()),
                        'time': Date.now()
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
    app.post('/api/water/pump', (req, res) => {
        let time = req.query.time;
    
        pump.squirt(time);
    
        res.json({
            'status': '200'
        });
    });
} catch (error) {
    console.log(error);
}

app.use(Express.static('client'));

app.get('/api/camera', (req, res) => {
    res.json({
        'status': '501'
    });
});

app.listen(serverPort, () => {
    console.log(`Listening at http://localhost:${serverPort}`);
});