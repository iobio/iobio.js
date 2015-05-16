var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

var cmdBuilder = function(service, params, opts) {
	// Call EventEmitter constructor
	EventEmitter.call(this);

	var urlParams = require('./utils/hash2UrlParams.js'),
		eventEmitter = require('events').EventEmitter(),
		fileParamer = require('./source/file.js'),
		urlParamer = require('./source/url.js'),
		sourceType;

	this.source = null;
	var me = this;	

	// handle iobio urls and files to correct
	for (var i=0; i< params.length; i++) {					
		if(params[i].slice(0,8) == 'iobio://') {
			sourceType = 'url'
			params[i] = urlParamer(params[i]);			
		} else if (Object.prototype.toString.call(params[i]) == '[object File]' || Object.prototype.toString.call(params[i]) == '[object Blob]') {
			sourceType = 'file';
			if (opts && opts.writeStream) 
				params[i] = fileParamer(service, params[i], function (s) {me.emit('writeStream', s)}, {write:false});
			else
				params[i] = fileParamer(service, params[i], function (s) {me.emit('writeStream', s)});
		}
	}

	// create source url
	this.source =  encodeURI(service + '?cmd=' + params.join(' ') + urlParams(opts));		
	if (sourceType == 'file') this.source += '&protocol=websocket';
}

// inherit eventEmitter
inherits(cmdBuilder, EventEmitter);

cmdBuilder.prototype.getSource = function() {
	return this.source;
}

cmdBuilder.prototype.url = function() {
	return 'http://' + this.source;
}

cmdBuilder.prototype.isFile = function() {
	if (sourceType == 'file') return true;
	else return false;
}

module.exports = cmdBuilder;