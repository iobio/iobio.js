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
	this.uri = urlBuilder.uri;

	if (protocol == 'ws' || protocol == 'wss')
		this.Runner  = require('./protocol/ws.js');
	else if (protocol == 'http' || protocol == 'https')
		this.Runner = require('./protocol/http.js');
}

// inherit eventEmitter
inherits(conn, EventEmitter);

// Functions

// Run command on connection
conn.prototype.run = function(pipedCommands) {
	// run
	this.runner = new this.Runner(this.urlBuilder, pipedCommands, this.opts);
	var me = this;

	// bind stream events
	require('./utils/bindStreamEvents')(this,this.runner);
}

module.exports = conn;