// Websocket code for running iobio command and getting results

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var ws = function(urlBuilder, opts) {
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var wsUrl = 'ws://' + urlBuilder.source,
		BinaryClient = require('binaryjs').BinaryClient,
		client = BinaryClient(wsUrl),
		me = this;                

		client.on('open', function(stream){
			var stream = client.createStream({event:'run', params : {'url':wsUrl}});    

			stream.on('createClientConnection', function(connection) {
				var serverAddress = connection.serverAddress || urlBuilder.getService();
				var dataClient = BinaryClient('ws://' + serverAddress);
				dataClient.on('open', function() {
					var dataStream = dataClient.createStream({event:'clientConnected', 'connectionID' : connection.id});
					if (opts.writeStream) 
						opts.writeStream(dataStream, function() { dataStream.end();} )
					else {
						var reader = new FileReader();               
						reader.onload = function(evt) { 							
							dataStream.write(evt.target.result); 
						}
						reader.onloadend = function(evt) { dataStream.end(); }             
						reader.readAsBinaryString( urlBuilder.getFile() );
					}
				})
            })      
			
			stream.on('data', function(data, options) {
				me.emit('data', data);
			});

			stream.on('end', function() {
				me.emit('end');
			})   

			stream.on('error', function(error) {
				me.emit('error', error);
			})      
		});
}

// inherit eventEmitter
inherits(ws, EventEmitter);

module.exports = ws;