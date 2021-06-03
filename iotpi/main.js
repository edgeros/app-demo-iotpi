#! /bin/javascript

/*
 * Copyright (c) 2020 EdgerOS Team.
 * All rights reserved.
 *
 * Detailed license information can be found in the LICENSE file.
 *
 * File: main.js.
 *
 * Author: liping@acoinfo.com
 *
 */
const Web = require('webapp');
const bodyParser = require('middleware').bodyParser;
const iosched = require('iosched');
var Device = require('device');

/* IoT Pi device */
var iotpi = undefined;

/* IoT Pi devices */
var iotpis = new Map();

/* Whether the app was awakened by a shared message */
if (ARGUMENT != undefined) {
	console.log('Awakened by share message:', ARGUMENT);
}

const app = Web.createApp();
app.use(bodyParser.json());
app.use(Web.static('./public', { index: ['index.html', 'index.htm'] }));

/*
 * Select device
 */
app.post('/api/select/:devid', function(req, res) {
	if (typeof req.params.devid !== 'string') {
		res.sendStatus(400);
		return;
	} else {
		iotpiRemove();
	}

	iotpi = new Device();
	iotpi.request(req.params.devid, function(error) {
		if (error) {
			res.sendStatus(503, error.message);
			iotpi = undefined;

		} else {
			res.send();
			iotpi.on('lost', iotpiRemove);

			iotpi.on('message', function(msg) {
				sockios.forEach(function(sockio) {
					sockio.emit('iotpi-message', msg);
				});
			});

			iotpi.send({ query: true }, function(error) {
				if (error) {
					console.error('Query IoT Pi error:', error.message);
				} else {
					console.log('Query IoT Pi Ok!');
				}
			}, 3);
		}
	});
});

// Start app.
app.start();

/* Socket IO */
var io = require('socket.io')(
	app, {
		path: '/iotpi',
		serveClient: false,
		pingInterval: 10000,
		pingTimeout: 5000,
		cookie: false
	}
);

/*
 * Client connect & disconnect
 */
io.on('connection', function(sockio) {
	sockio.on('iotpi-control', function(msg) {
		if (iotpi && iotpi.devid) {
			console.log('Client send message:', JSON.stringify(msg));
			iotpi.send(msg, function(error) {
				if (error) {
					console.error('Send message to IoT Pi error:', error.message);
				}
			}, 3);
		} else {
			sockio.emit('iotpi-error', { error: 'No device!' });
		}
	});

	sockio.on('iotpi-list', function(result) {
		var devs = [];
		iotpis.forEach(function(iotpi) {
			devs.push(iotpi);
		});
		result(devs);
	});
});

/*
 * Get All Iot Pi device
 */
Device.list(true, function(error, list) {
	if (list) {
		list.forEach(function(dev) {
			Device.info(dev.devid, function(error, info) {
				if (info && info.report.name === 'IoT Pi') {
					iotpis.set(dev.devid, {
						devid: dev.devid, alias: dev.alias, report: info.report
					});
				}
			});
		});
	}
});

/*
 * Iot Pi device lost
 */
Device.on('lost', function(devid) {
	if (iotpis.has(devid)) {
		iotpis.delete(devid);
		if (iotpi && iotpi.devid === devid) {
			iotpiRemove();
		}
		io.emit('iotpi-lost', devid);
	}
});

/*
 * Iot Pi device join
 */
Device.on('join', function(devid, info) {
	if (info.report.name === 'IoT Pi') {
		var devobj = {
			devid: devid, alias: info.alias, report: info.report
		};
		iotpis.set(devid, devobj);
		io.emit('iotpi-join', devobj);
	}
});

/*
 * Iot Pi Remove
 */
function iotpiRemove() {
	if (iotpi) {
		iotpi.release();
		iotpi.removeAllListeners();
	}
}

/*
 * Event loop
 */
iosched.forever();
