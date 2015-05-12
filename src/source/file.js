var file = function(fileObj) {

}

module.exports = file;



 var me = this;
         var connectionID = this._makeid();
         var client = BinaryClient(this.iobio.samtools + '?id=', {'connectionID' : connectionID} );
         client.on('open', function(stream){
            var stream = client.createStream({event:'setID', 'connectionID':connectionID});
            stream.end();
         })
      
         var url = this.iobio.samtools + "?protocol=websocket&encoding=binary&cmd=view -S -b " + encodeURIComponent("http://client?&id="+connectionID);
         var ended = 0;
         var me = this;
         // send data to samtools when it asks for it         
         client.on('stream', function(stream, options) {
            stream.write(me.header.toStr);            
            for (var i=0; i < regions.length; i++) {
              var region = regions[i];
               me.convert('sam', region.name, region.start, region.end, function(data,e) {   
                  stream.write(data);                   
                  ended += 1;                  
                  if ( regions.length == ended) stream.end();
               }, {noHeader:true});               
            }
         })