var ws = function(url,opts,callback) {
	var wsUrl = 'ws://' + url
  var BinaryClient = require('Binary').BinaryClient;
	var client = BinaryClient(wsUrl);                
    client.on('open', function(stream){
      var stream = client.createStream({event:'run', params : {'url':wsUrl}});          
      
      stream.on('data', function(data, options) {
        callback(data);
      });

      stream.on('end', function() {
      	// fire end
      })      
    });
}

module.exports = ws;