// create url for file and setup streams

var file = function(service, fileObj, callback) {   
   var me = this;
   var connectionID = require('shortid').generate();
   this.client = BinaryClient( 'ws://' + service + '?id=', {'connectionID' : connectionID} );
   this.client.on('open', function(stream){
      var stream = me.client.createStream({event:'setID', 'connectionID':connectionID});
      stream.end();
   })

   this.client.on('stream', function(stream, options) {
      callback(stream);
   })

   return  encodeURIComponent("http://client?&id="+connectionID) ;
}


module.exports = file;