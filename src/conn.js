// Create connection and handle the results

var conn = function(protocol, url, opts) {	

	var runner;	
	this.opts = opts;
	this.url = url	

	if (protocol == 'ws')
		this.runner = require('./protocol/ws.js');
	else if (protocol == 'http')
		this.runner = require('./protocol/http.js');
}

// Functions

// Run command on connection
conn.prototype.run = function(callback) {
	var me = this;	
	me.runner(this.url,me.opts,callback);
}

module.exports = conn;