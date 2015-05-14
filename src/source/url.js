
var url = function(param) {	
	var p = 'http' + param.slice(5,param.length);
	return encodeURIComponent( p ); 

}

module.exports = url;