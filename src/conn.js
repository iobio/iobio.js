// Create connection and handle the results

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var conn = function(protocol, url, opts) {	
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var me = this;	
	this.opts = opts;
	this.url = url	

	if (protocol == 'ws')
		this.Runner  = require('./protocol/ws.js');
	else if (protocol == 'http')
		this.Runner = require('./protocol/http.js');	
}

// inherit eventEmitter
inherits(conn, EventEmitter);

// Functions

// Run command on connection
conn.prototype.run = function() {
	// run
	var runner = new this.Runner(this.url,this.opts);

	// bind stream events	
	require('./utils/bindStreamEvents')(this,runner);
}

module.exports = conn;