// Creates the command

var urlBuilder = function(service, params, opts) {
	var urlParams = require('./utils/hash2UrlParams.js'),
		eventEmitter = require('events').EventEmitter(),
		fileParameter = require('./source/file.js'),
		urlParameter = require('./source/url.js'),
		fileSource = false;

		opts = opts || {};

	this.uri = null;
	this.service = service;
	this.files = [];
	this.argCommands = {};
	var me = this;

	// handle iobio urls and files/functions
	for (var i=0; i< params.length; i++) {
		if (Object.prototype.toString.call(params[i]) == '[object File]' || Object.prototype.toString.call(params[i]) == '[object Blob]' || Object.prototype.toString.call(params[i]) == '[object Function]') {
			fileSource = true;
			var source = new fileParameter(params[i]);
			me.files.push( source );
			params[i] = source.getUrl();
		} else if(params[i].toString() == '[object iobio.cmd]') {
			me.argCommands[params[i].id] = params[i];
			var source = new urlParameter(params[i].url());
			params[i] = source.getUrl();
		} else if(params[i].toString().slice(0,8) == 'iobio://') {
			var source = new urlParameter(params[i]);
			params[i] = source.getUrl();
		}
	}

	// handle stdin special case
	if(opts && opts.urlparams && opts.urlparams.stdin) {
		var source = new urlParameter(opts.urlparams.stdin);
		opts.urlparams.stdin = source.getUrl();
	}

	// create source url
	this.uri =  encodeURI(service + '?cmd=' + params.join(' ') + urlParams(opts.urlparams) + urlParams({id:opts.id}));
	if (fileSource) this.uri += '&protocol=websocket';
}

module.exports = urlBuilder;