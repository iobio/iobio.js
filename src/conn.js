var conn = function(protocol, cmdBuilder, opts) {	

	var runner;
	this.cmdBuilder = cmdBuilder,
	this.opts = opts;	

	if (protocol == 'ws')
		this.runner = require('./protocol/ws.js');
	else if (protocol == 'http')
		this.runner = require('./protocol/http.js');
}

// Functions

// Run command on connection
conn.prototype.run = function(callbackWrite, callbackRead) {
	var me = this;
	me.cmdBuilder.on('writeStream', function(s) { callbackWrite(s) })
	me.runner(me.cmdBuilder.getSource(),me.opts,callbackRead);
}

module.exports = conn;