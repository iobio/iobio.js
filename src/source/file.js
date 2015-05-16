// create url for file and setup streams

var file = function(service, fileObj, callback, opts) {   
    var me = this,
        BinaryClient = require('Binary').BinaryClient,
        connectionID = require('shortid').generate(),
        extend = require('extend'),
        options = { write:true };
    
    extend(options, opts);



    // set client id for service that will be written to
    var client = BinaryClient( 'ws://' + service + '?id=', {'connectionID' : connectionID} );
    client.on('open', function(stream){
        var stream = client.createStream({event:'setID', 'connectionID':connectionID});
        stream.end();
    })

    // fires when stream is ready write
    client.on('stream', function(stream, opts) {      
        callback(stream);
        if (options.write) {
            var reader = new FileReader();               
            reader.onload = function(evt) { stream.write(evt.target.result); }
            reader.onloadend = function(evt) { stream.end(); }             
            reader.readAsBinaryString(fileObj);
        }
    })

    return  encodeURIComponent("http://client?&id="+connectionID) ;
}


module.exports = file;