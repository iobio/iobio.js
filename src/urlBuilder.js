// Creates the command

var urlBuilder = function(service, params, opts) {	
	var urlParams = require('./utils/hash2UrlParams.js'),
		eventEmitter = require('events').EventEmitter(),
		fileParamer = require('./source/file.js'),
		urlParamer = require('./source/url.js'),
		sourceType
		opts = opts || {};

	this.uri = null;	
	this.service = service;
	var me = this;	

	// handle iobio urls and files to correct
	for (var i=0; i< params.length; i++) {					
		if(params[i].slice(0,8) == 'iobio://') {
			sourceType = 'url'
			var source = new urlParamer(params[i]);
			params[i] = source.getUrl();
		} else if (Object.prototype.toString.call(params[i]) == '[object File]' || Object.prototype.toString.call(params[i]) == '[object Blob]') {
			sourceType = 'file';						
			me.file = new fileParamer(params[i])
			params[i] = me.file.getUrl();			
		}
	}

	// create source url
	this.uri =  encodeURI(service + '?cmd=' + params.join(' ') + urlParams(opts.urlparams) + urlParams({id:opts.id}));		
	if (sourceType == 'file') this.uri += '&protocol=websocket';
}

urlBuilder.prototype.getFile = function() { return this.file; }
urlBuilder.prototype.getService = function() { return this.service; }

module.exports = urlBuilder;