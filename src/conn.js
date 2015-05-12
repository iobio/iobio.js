
var conn = function(protocol, url, opts, callback) {	
	var runner;

	if (protocol == 'ws')
		runner = require('./protocol/ws.js');
	else if (protocol == 'http')
		runner = require('./protocol/http.js');

	runner(url,opts,callback);
	
}

module.exports = conn;