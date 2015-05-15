'use strict';

var iobio = require('../src/cmd.js')

describe("Command", function() {
	
    var cmd = new iobio.cmd('samtools.iobio.io', ['view', 'http://s3.amazonaws.com/iobio/jasmine_files/test.bam', '1']);

    describe("URL generation", function() {

        it("creates a http url", function() {
          var url = cmd.http();
          expect(url).toEqual('http://samtools.iobio.io?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });

        it("creates a websocket url", function() {
          var url = cmd.ws();
          expect(url).toEqual('ws://samtools.iobio.io?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });

        it("creates an iobio url", function() {
          var url = cmd.url();
          expect(url).toEqual('iobio://samtools.iobio.io?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });
    });

    describe("Execute", function() {
        var data;
        cmd.run();
        beforeEach(function(done) {
            cmd.on('data', function(d) {                
                data = d.split('\t')[0];
                done();
            },20)
        });
        it("simple command", function() {
            expect(data).toEqual('ERR194147.602999777');                        
        });
    });

    describe("Execute", function() {
        var data;
        var cmdPipe = new iobio.cmd('samtools.iobio.io', ['view', '-b', '-h', 'http://s3.amazonaws.com/iobio/jasmine_files/test.bam', '1'], {'encoding':'binary'})
                .pipe( 'bamtools.iobio.io', ['convert', '-format', 'json'] );
        cmdPipe.run();
        beforeEach(function(done) {
            cmdPipe.on('data', function(d) {                
                data = JSON.parse(d).name;
                done();
            },20)
        });
        it("piped command", function() {
            expect(data).toEqual('ERR194147.602999777');                        
        });
    });
});

