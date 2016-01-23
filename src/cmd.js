// Creates and executes iobio commands

// Grab an existing iobio namespace object, or create a blank object
// if it doesn't exist
var iobio = global.iobio || {};
global.iobio = iobio;

// export if being used as a node module - needed for test framework
if ( typeof module === 'object' ) { module.exports = iobio;}

var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');
var shortid = require('shortid');


// Command function starts here
iobio.cmd = function(service, params, opts) {	
	// Call EventEmitter constructor
	EventEmitter.call(this);
	
	var extend = require('extend');
	
   	this.options = {
   		/* defaults */ 
   		id: shortid.generate()
   	};
   	extend(this.options, opts);      	
	this.protocol = 'ws';	
	this.pipedCommands = { };	
	this.pipedCommands[ this.options.id ] = this;

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

	// create new command
	var newCmd = new iobio.cmd(service, params, opts || {});
	// var newCmd = new iobio.cmd(service, params, opts || {});

	// transfer pipedCommands to new command;
	for (var id in this.pipedCommands ) { newCmd.pipedCommands[id] = this.pipedCommands[id]; }
	
	return newCmd;
}

// Create url
iobio.cmd.prototype.url = function() { return 'iobio://' + this.connection.uri; }
iobio.cmd.prototype.http = function() { return 'http://' + this.connection.uri; }
iobio.cmd.prototype.ws = function() { return 'ws://' + this.connection.uri; }
iobio.cmd.prototype.id = this.id 


// getters/setters
iobio.cmd.prototype.protocol = function(_) {
	if (!arguments.length) return this.protocol;
	this.protocol = _;
	return this;
}

// Execute command
iobio.cmd.prototype.run = function() {	

 	// run 
	this.connection.run(this.pipedCommands); 
	// send pipedCommands so that each command can properly handle the request comming back
	// e.g. if the second command of 3 that are piped together is sending file data then it 
	// should handle the request for data coming from the server.
}

// Kill running command instantly, leaving any data in the pipe
iobio.cmd.prototype.kill = function() {
	this.connection.runner.kill();
}

// End command safely. This may take a second or two and still give more data
iobio.cmd.prototype.end = function() {
	this.connection.runner.end();
}