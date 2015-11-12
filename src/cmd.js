// Creates and executes iobio commands

// Grab an existing iobio namespace object, or create a blank object
// if it doesn't exist
var iobio = global.iobio || {};
global.iobio = iobio;


// catch page unload event and send disconnect events to all connections
global.onbeforeunload = function() {
	global.iobioClients.forEach(function(runner){
		try {
			runner.client.close();
			// runner.client.createStream({event:'disconnecting'});
		} catch(e) {

		}
	});
};

// export if being used as a node module - needed for test framework
if ( typeof module === 'object' ) { module.exports = iobio;}

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');


// Command function starts here
iobio.cmd = function(service, params, opts) {	
	// Call EventEmitter constructor
	EventEmitter.call(this);

	// var cmdBuilder = require('./cmdBuilder.js'), // creates iobio commands 		
	var extend = require('extend');
	
   	this.options = { /* defaults */ };
   	extend(this.options, opts);      	
	this.protocol = 'ws';		

	// make sure params isn't undefined
	params = params || [];

	var conn = require('./conn.js'); // handles connection code		
	this.connection = new conn(this.protocol, service, params, this.options);
	var me = this;
	
	// bind stream events	
	require('./utils/bindStreamEvents')(this, this.connection);
}

// inherit eventEmitter
inherits(iobio.cmd, EventEmitter);

// functions

// Chain commands
iobio.cmd.prototype.pipe = function(service, params, opts) {	
	
	
	// add current url to params		
	params = params || [];
	params.push( this.url() );

	// add write stream to options	
	opts = opts || {};
	if (this.options.writeStream) {
		opts.writeStream = this.options.writeStream; 
		opts.writeStream.serverAddress = this.connection.service;
	}
	
	var newCmd = new iobio.cmd(service, params, opts);
	
	// generate base url
	// var conn = require('./conn');
	// if (this.options.writeStream) opts.writeStream = this.options.writeStream; // add write stream to options	
	// newCmd.connection = new conn( this.protocol, service, params, opts );	
	
	// // bind stream events	
	// require('./utils/bindStreamEvents')(newCmd, newCmd.connection);
	
	return newCmd;
}

// Create url
iobio.cmd.prototype.url = function() { return 'iobio://' + this.connection.source; }
iobio.cmd.prototype.http = function() { return 'http://' + this.connection.source; }
iobio.cmd.prototype.ws = function() { return 'ws://' + this.connection.source; }


// getters/setters
iobio.cmd.prototype.protocol = function(_) {
	if (!arguments.length) return this.protocol;
	this.protocol = _;
	return this;
}

// Execute command
iobio.cmd.prototype.run = function() {	

 	// run 
	this.connection.run();
}