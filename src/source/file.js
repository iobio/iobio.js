// Create iobio url for a file command and setup stream for reading the file to the iobio web service

var file = function(fileObj) {       
    var me = this;
    me.fileObj = fileObj
    me.url = encodeURIComponent("http://client");
}

file.prototype.getType = function() { return 'file'; }

file.prototype.getFileObj = function() { return this.fileObj; }

file.prototype.getUrl = function( ) { return this.url; }

file.prototype.write = function(stream, options) {

    var me = this;
    var chunkSize = options.chunkSize || (500 * 1024);             ;
    if (options && options.writeStream) 
        options.writeStream(stream, function() {stream.end()})
    else {        
        (new BlobReadStream(this.fileObj, {'chunkSize': chunkSize})).pipe(stream);
    }
}

module.exports = file;