var cmder = function() {
	var cmdUrl = require('./source/url.js'),
		cmdFile = require('./source/file.js')		

	function my(service, params, opts){				

		// create url params from opts
		var optStr = ''
		if (opts)
			optStr = '&' + Object.keys(opts).map(function(k) { return k+'='+opts[k]}).join('&');		

		// handle iobio urls an files
		for (var i=0; i< params.length; i++) {					
			if(params[i].slice(0,8) == 'iobio://') {				
				params[i] = cmdUrl(params[i]);								
			} else if (typeof(params[i]) == 'File') {				
				params[i] = cmdFile(params[i]);				
			}
		}
		return encodeURI(service + '?cmd=' + params.join(' ') + optStr);		
	}

	return my;
}

module.exports = cmder