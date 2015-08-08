// Create iobio url for a file command and setup stream for reading the file to the iobio web service

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