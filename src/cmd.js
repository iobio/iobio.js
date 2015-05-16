// Grab an existing iobio namespace object, or create a blank object
// if it doesn't exist
var iobio = global.iobio || {};
global.iobio = iobio;

// export if being used as a node module - needed for test framework
if ( typeof module === 'object' ) { module.exports = iobio;}

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

iobio.cmd = function(service, params, opts) {	
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var cmdBuilder = require('./cmdBuilder.js'), // creates iobio commands 		
		extend = require('extend');
	
   	this.options = { /* defaults */ };
   	extend(this.options, opts);      	
	this.protocol = 'ws';	
	this.command = new cmdBuilder(service,params,opts);
}

// inherit eventEmitter
inherits(iobio.cmd, EventEmitter);

// functions

// Chain commands
iobio.cmd.prototype.pipe = function(service, params, opts) {	

	// add current url to params
	params.push(this.url())
	
	// generate base url
	var cmdBuilder = require('./cmdBuilder.js');
	if (this.options.writeStream) opts.writeStream = this.options.writeStream; // add write stream to options	
	this.command = new cmdBuilder( service, params, opts );	
	return this;
}

// Create url
iobio.cmd.prototype.url = function() { return 'iobio://' + this.command.getSource(); }
// Create http
iobio.cmd.prototype.http = function() { return 'http://' + this.command.getSource(); }
// Create ws
iobio.cmd.prototype.ws = function() { return 'ws://' + this.command.getSource(); }


// getters/setters
iobio.cmd.prototype.protocol = function(_) {
	if (!arguments.length) return this.protocol;
	this.protocol = _;
	return this;
}

// Execute command
iobio.cmd.prototype.run = function() {
	var me = this,
		conn = require('./conn.js'), // handles connection code		
		connection = new conn(this.protocol, this.command.getSource(), this.opts);
	
	// run writeStream function if present
	if (this.options.writeStream) {
		this.command.on('writeStream', this.options.writeStream);
	}

 	// run 
	connection.run(function(data) { me.emit('data', data)});
}