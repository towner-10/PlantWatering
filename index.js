//const Water = require('./server/Water');
const Express = require('express');
const app = Express();
const WebSocket = require('ws');
const serverPort = 80;
const wss = new WebSocket.Server({port: 443});
const SerialPort = require('serialport')
const port = new SerialPort('/dev/tty-usbserial1', function (err) {
    if (err) {
        return console.log('Error: ', err.message);
    }
    else {
        port.on('data', function (data) {
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send({
                        'data': parseInt(data.toString()),
                        'time': Date.now()
                    });
                }
            });
        });
    }
});

app.use(Express.static('client'));

app.get('/api/camera', (req, res) => {
    res.json({
        'status': '501'
    });
});

app.post('/api/water/pump', (req, res) => {
    let time = req.query.time;

    Water.squirt(time);

    res.json({
        'status': '200'
    });
});

app.listen(serverPort, () => {
    console.log(`Listening at http://localhost:${serverPort}`);
});