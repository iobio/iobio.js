// Websocket code for running iobio command and getting results

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var ws = function(url,opts) {
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var wsUrl = 'ws://' + url,
		BinaryClient = require('Binary').BinaryClient,
		client = BinaryClient(wsUrl),
		me = this;                

		client.on('open', function(stream){
			var stream = client.createStream({event:'run', params : {'url':wsUrl}});          
			
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