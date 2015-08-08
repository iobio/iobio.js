// Create iobio url for a file command and setup stream for reading the file to the iobio web service

// var file = function(service, fileObj, opts) {   
//     var me = this,
//         BinaryClient = require('binaryjs').BinaryClient,
//         connectionID = require('shortid').generate(),
//         extend = require('extend'),
//         options = { /* defaults */ };
    
//     extend(options, opts);

//     // set client id for service that will be written to
//     var client = BinaryClient( 'ws://' + service + '?id=', {'connectionID' : connectionID} );
//     client.on('open', function(stream){
//         var stream = client.createStream({event:'setID', 'connectionID':connectionID});
//         stream.end();
//     })

//     // fires when stream is ready write
//     client.on('stream', function(stream, opts) {                      
//         if (options.writeStream) 
//             options.writeStream(stream, function() {stream.end()})
//         else {
//             var reader = new FileReader();               
//             reader.onload = function(evt) { stream.write(evt.target.result); }
//             reader.onloadend = function(evt) { stream.end(); }             
//             reader.readAsBinaryString(fileObj);
//         }
//     })

//     return  encodeURIComponent("http://client?&id="+connectionID);
// }

var file = function(fileObj) {       
    var me = this;
    me.fileObj = fileObj;

    return  encodeURIComponent("http://client");
}

file.prototype.write = function(stream, options) {
    if (options && options.writeStream) 
        options.writeStream(stream, function() {stream.end()})
    else {
        var reader = new FileReader();               
        reader.onload = function(evt) { stream.write(evt.target.result); }
        reader.onloadend = function(evt) { stream.end(); }             
        reader.readAsBinaryString(me.fileObj);
    }
}

module.exports = file;