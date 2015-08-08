// Creates the command

var urlBuilder = function(service, params, opts) {	
	var urlParams = require('./utils/hash2UrlParams.js'),
		eventEmitter = require('events').EventEmitter(),
		fileParamer = require('./source/file.js'),
		urlParamer = require('./source/url.js'),
		sourceType
		opts = opts || {};

	this.source = null;
	this.service = service;
	var me = this;	

	// handle iobio urls and files to correct
	for (var i=0; i< params.length; i++) {					
		if(params[i].slice(0,8) == 'iobio://') {
			sourceType = 'url'
			params[i] = urlParamer(params[i]);			
		} else if (Object.prototype.toString.call(params[i]) == '[object File]' || Object.prototype.toString.call(params[i]) == '[object Blob]') {
			sourceType = 'file';			
			me.file = params[i];
			params[i] = fileParamer(params[i]);			
		}
	}

	// create source url
	this.source =  encodeURI(service + '?cmd=' + params.join(' ') + urlParams(opts.urlparams));		
	if (sourceType == 'file') this.source += '&protocol=websocket';
}

urlBuilder.prototype.getFile = function() { return this.file; }
urlBuilder.prototype.getService = function() { return this.service; }

module.exports = urlBuilder;