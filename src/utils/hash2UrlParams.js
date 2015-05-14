var urlParams = function(params) {
	var str = ''
	if (params)
		str = '&' + Object.keys(params).map(function(k) { return k+'='+params[k]}).join('&');		
	return str;
}

module.exports = urlParams;