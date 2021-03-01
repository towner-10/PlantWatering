const Express = require('express');
const app = Express();
const WebSocket = require('ws');
const serverPort = 80;
const wss = new WebSocket.Server({port: 443});
const SerialPort = require('serialport');
const NodeWebcam = require( "node-webcam" );
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

const cameraOptions = {
    width: 1280,
    height: 720,
    quality: 100,
    frames: 60,
    delay: 0,
    saveShots: false,
    output: "jpeg",
    device: false,
    callbackReturn: "location",
    verbose: false
};

try {
    const Webcam = NodeWebcam.create(cameraOptions);
    
    app.get('/api/camera', (req, res) => {
        NodeWebcam.capture( "test_picture", cameraOptions, function( err, data ) {
            res.status(200).send("<img src='" + data + "'>");
        });
    });
    
} catch (error) {
    console.log(error);
}

try {
    // Simple trycatch to make sure program doesn't crash if the Pump doesn't work on current system
    const Pump = require('./server/modules/Pump');
    const pump = new Pump(21, 10000);

    // Put pump API here
    app.get('/api/water/pump', (req, res) => {
        var time = req.query.time;

        pump.enable();

        //console.log(time);
    
        //pump.squirt(time);
    
        res.status(200).send("Pumping");
    });
} catch (error) {
    console.log(error);
}

app.use(Express.static('client'));

app.listen(serverPort, () => {
    console.log(`Listening at http://localhost:${serverPort}`);
});