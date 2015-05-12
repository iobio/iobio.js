// Grab an existing iobio namespace object, or create a blank object
// if it doesn't exist
var iobio = window.iobio || {};
window.iobio = iobio;

iobio.cmd = function() {
	var cmder = require('./cmder.js')(), // creates iobio commands 
		conn = require('./conn.js'), // handles connection code
		protocol = 'ws',
		source;

	function my(service, params, opts) {
		// generate base url
		source = cmder( service, params, opts );
		return my;
	}
	// Add version
	my.version = require('./version.js');

	// Chain commands
	my.then = function(service, params, opts) {		
		// add current url to params
		params.push(my.url())
		// generate base url
		source = cmder( service, params, opts );		
		return my;
	}

	// Create url
	my.url = function() { return 'iobio://' + source; }
	// Create http
	my.http = function() { return 'http://' + source; }
	// Create ws
	my.ws = function() { return 'ws://' + source; }

	my.protocol = function(_) {
		if (!arguments.length) return protocol;
		protocol = _;
		return my;
	};

	// Execute command
	my.run = function(callback, opts) {
		conn(protocol, source, opts, callback);
	}

	return my;
}