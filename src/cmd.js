// Creates and executes iobio commands

// Grab an existing iobio namespace object, or create a blank object
// if it doesn't exist
var iobio = global.iobio || {};
global.iobio = iobio;

iobio.version = require('../package.json').version;

// export if being used as a node module - needed for test framework
if ( typeof module === 'object' ) { module.exports = iobio;}

var EventEmitter = require('events').EventEmitter,
	inherits = require('inherits'),
	shortid = require('shortid'),
	extend = require('extend'),
	conn = require('./conn.js');


// Command function starts here
iobio.cmd = function(service, params, opts) {
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var me = this;

	this.id = shortid.generate()
   	this.options = {
   		/* defaults */
   		id: me.id
   	};
   	extend(this.options, opts);
	this.protocol = this.options.ssl ? 'wss' : 'ws';
	this.service = service;
	this.params = params;
	this.pipedCommands = {};
	this.pipedCommands[ this.options.id ] = this;
	this.argCommands = {};

	// make sure params isn't undefined
	params = params || [];

	// handles the connection
	this.connection = new conn(this.protocol, service, params, this.options);

	// bind stream events
	require('./utils/bindStreamEvents')(this, this.connection);
}

// inherit eventEmitter
inherits(iobio.cmd, EventEmitter);

// functions

// Chain commands
iobio.cmd.prototype.pipe = function(service, params, opts) {

	// Default options
	var options = {
		urlparams : { stdin: this.url() }
	}
	// merge options
	extend(true, options, opts);

	// add current url to params
	params = params || [];
	// params.push( this.url() );

	// create new command
	var newCmd = new iobio.cmd(service, params, options);

	// transfer pipedCommands to new command;
	for (var id in this.pipedCommands ) {
		newCmd.pipedCommands[id] = this.pipedCommands[id];

		// transfer argCommands to new command;
		for (var id in this.connection.urlBuilder.argCommands ) {
			newCmd.connection.urlBuilder.argCommands[id] = this.connection.urlBuilder.argCommands[id];
		}
	}

	return newCmd;
}

// Create url
iobio.cmd.prototype.url = function() { return 'iobio://' + this.connection.uri; }
iobio.cmd.prototype.http = function() { return 'http://' + this.connection.uri; }
iobio.cmd.prototype.https = function() { return 'https://' + this.connection.uri; }
iobio.cmd.prototype.ws = function() { return 'ws://' + this.connection.uri; }
iobio.cmd.prototype.wss = function() { return 'wss://' + this.connection.uri; }
iobio.cmd.prototype.id = this.id


// getters/setters
iobio.cmd.prototype.protocol = function(_) {
	if (!arguments.length) return this.protocol;
	this.protocol = _;
	return this;
}

iobio.cmd.prototype.service = function(_) {
	if (!arguments.length) return this.service;
	this.service = _;
	return this;
}

iobio.cmd.prototype.arguments = function(_) {
	if (!arguments.length) return this.params;
	this.params = _;
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

// Close client and let server handle cleanup
iobio.cmd.prototype.closeClient = function() {
	if (this.connection && this.connection.runner )
		this.connection.runner.closeClient();
}

// Kill running command instantly, leaving any data in the pipe
iobio.cmd.prototype.kill = function() {
	if (this.connection && this.connection.runner )
		this.connection.runner.kill();
}

// End command safely. This may take a second or two and still give more data
iobio.cmd.prototype.end = function() {
	if (this.connection && this.connection.runner )
		this.connection.runner.end();
}

iobio.cmd.prototype.toString = function() {
	return '[object iobio.cmd]'
}