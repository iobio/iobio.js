// Create iobio url for a file/function command and setup stream for reading the file/function to the iobio web service

var BlobReadStream = require('binaryjs').BlobReadStream;

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
    this.stream = stream;
    var chunkSize = options.chunkSize || (500 * 1024);             ;
    // check if fileObj is a function and if so execute it
    if (Object.prototype.toString.call(this.fileObj) == '[object Function]')
        this.fileObj(stream, function() {stream.end()});
    else {
        (new BlobReadStream(this.fileObj, {'chunkSize': chunkSize})).pipe(stream);
    }
}

file.prototype.end = function() {
    if (this.stream) this.stream.end();
}

module.exports = file;