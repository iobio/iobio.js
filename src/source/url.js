// Create iobio url for a url command

var url = function(param) {	
	var p = 'http' + param.slice(5,param.length);
	this.url =  encodeURIComponent( p ); 
}

url.prototype.getType = function() { return 'url'; }

url.prototype.getUrl = function( ) { return this.url; }

module.exports = url;