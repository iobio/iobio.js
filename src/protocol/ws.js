// Websocket code for running iobio command and getting results

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var ws = function(urlBuilder, pipedCommands, opts) {
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var wsUrl = 'wss://' + urlBuilder.uri,
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
				var cmd = pipedCommands[connection.id];
				if (cmd) {
					var cmdOpts = cmd.options;
					var cmdUrlBuilder = cmd.connection.urlBuilder;
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
					serverAddress = cmdUrlBuilder.getService();

				// connect to server
				var dataClient = BinaryClient('wss://' + serverAddress);
				dataClient.on('open', function() {
					var dataStream = dataClient.createStream({event:'clientConnected', 'connectionID' : connection.id});
					var file = cmdUrlBuilder.getFile();
					file.write(dataStream, cmdOpts);
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
	if (this.stream)
		this.stream.destroy();
}

ws.prototype.end = function() {
	if (this.stream)
		this.stream.end();
}

module.exports = ws;