// Creates and executes iobio commands

// Grab an existing iobio namespace object, or create a blank object
// if it doesn't exist
var iobio = global.iobio || {};
global.iobio = iobio;

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

	var conn = require('./conn.js'); // handles connection code		
	this.connection = new conn(this.protocol, service, params, this.options);
	// bind stream events	
	require('./utils/bindStreamEvents')(this, this.connection);
}

// inherit eventEmitter
inherits(iobio.cmd, EventEmitter);

// functions

// Chain commands
iobio.cmd.prototype.pipe = function(service, params, opts) {	

	// add current url to params
	params.push(this.url())
	
	// generate base url
	var conn = require('./conn');
	if (this.options.writeStream) opts.writeStream = this.options.writeStream; // add write stream to options	
	this.connection = new conn( this.protocol, service, params, opts );	
	
	// bind stream events	
	require('./utils/bindStreamEvents')(this, this.connection);
	
	return this;
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