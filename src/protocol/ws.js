// Websocket code for running iobio command and getting results

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var ws = function(urlBuilder, pipedCommands, opts) {
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var protocol = opts.ssl ? 'wss' : 'ws',
		wsUrl = protocol + '://' + urlBuilder.uri,
		BinaryClient = require('binaryjs').BinaryClient,
		client = BinaryClient(wsUrl),
		me = this;

		this.client = client;
		this.stream;

		client.on('open', function(stream){
			var stream = client.createStream({event:'run', params : {'url':wsUrl}}),
				first = true;
			me.stream = stream;

			stream.on('createClientConnection', function(connection) {
				// determine serverAddress
				var serverAddress;
				// grab first half of connection id which is the command id
				var cmdId = connection.id.split('&')[0];

				// get correct command
				var cmd;
				if (pipedCommands[cmdId]) {
					cmd = pipedCommands[cmdId];
					var cmdOpts = cmd.options;
					var cmdUrlBuilder = cmd.connection.urlBuilder;
				} else if (urlBuilder.argCommands[cmdId]) {
					cmd = urlBuilder.argCommands[cmdId];
					var cmdOpts =  cmd.options;
					var cmdUrlBuilder =  cmd.connection.urlBuilder;
				} else {
					var cmdOpts =  opts;
					var cmdUrlBuilder =  urlBuilder;
				}


				// go through by priority
				if (connection.serverAddress)  // defined by requesting iobio service
					serverAddress = connection.serverAddress;
				else if (cmdOpts && cmdOpts.writeStream && cmdOpts.writeStream.serverAddress) // defined by writestream on client
					serverAddress = cmdOpts.writeStream.serverAddress
				else  // defined by client
					serverAddress = cmdUrlBuilder.service;

				// connect to server
				var dataClient = BinaryClient(protocol + '://' + serverAddress);
				dataClient.on('open', function() {
					var dataStream = dataClient.createStream({event:'clientConnected', 'connectionID' : connection.id});
					var argPos = connection.argPos || 0;
					var file = cmdUrlBuilder.files[argPos];
					file.write(dataStream, cmdOpts);
					dataStream.on('softend', function() {
						file.end();
					})
				})
            })

			stream.on('data', function(data, options) {
				if(first) { first=false; me.emit('start'); }
				me.emit('data', data);
			});

			stream.on('end', function() {
				me.emit('end');
			})

			stream.on('exit', function(code) {
				me.emit('exit', code);
			})

			stream.on('error', function(error) {
				me.emit('error', error);
			})

			stream.on('queue', function(queue) {
				me.emit('queue', queue)
			})
		});
}

// inherit eventEmitter
inherits(ws, EventEmitter);

ws.prototype.closeClient = function() {
	if (this.client)
		this.client.close();
}

ws.prototype.kill = function() {
	// end stream immediately
	if (this.stream)
		this.stream.end();
}

ws.prototype.end = function() {
	// send end event without ending stream
    // this lets upstream streams end first, which causes
    // downstream streams to end gracefully when the data runs out
	if (this.stream)
		this.stream.message('softend');
}

module.exports = ws;