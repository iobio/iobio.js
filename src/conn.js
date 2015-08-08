// Create connection and handle the results

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var conn = function(protocol, service, params, opts) {	
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var me = this;	
	this.opts = opts;
	this.service = service;
	this.protocol = protocol;
	this.params = params;	

	// create url	
	var UrlBuilder = require('./urlBuilder.js');
	var	urlBuilder = new UrlBuilder(service, params, opts);
	this.urlBuilder = urlBuilder;
	this.source = urlBuilder.source;

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
	var runner = new this.Runner(this.urlBuilder, this.opts);

	// bind stream events	
	require('./utils/bindStreamEvents')(this,runner);
}

module.exports = conn;