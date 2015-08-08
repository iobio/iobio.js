'use strict';

var iobio = require('../src/cmd.js')

describe("Command", function() {
	
    var cmd = new iobio.cmd('samtools.iobio.io', ['view', 'http://s3.amazonaws.com/iobio/jasmine_files/test.bam', '1']);
    cmd.on('error', function(error) { /*ignore errors*/ })

    describe("URL generation", function() {

        it("creates an iobio url", function() {
          var url = cmd.url();
          expect(url).toEqual('iobio://samtools.iobio.io?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });

        it("creates a http url", function() {
          var url = cmd.http();
          expect(url).toEqual('http://samtools.iobio.io?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });

        it("creates a websocket url", function() {
          var url = cmd.ws();
          expect(url).toEqual('ws://samtools.iobio.io?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });
    });

    cmd.run();        
    describe("Execute", function() {
        var data;        
        beforeEach(function(done) {
            cmd.on('data', function(d) {                
                data = d.split('\t')[0];
                done();
            })
        },20000);
        it("simple url command", function() {
            expect(data).toEqual('ERR194147.602999777');                        
        });
    });

    describe("Stream event", function() {
        var response;        
        beforeEach(function(done) {
            cmd.on('end', function(d) {                
                response = 'end';
                done();
            })
        },20000);
        it("emits 'end' event", function() {
            expect(response).toEqual('end');                        
        });
    });

    describe("Execute", function() {
        var data;
        var cmdPipe = new iobio.cmd(
                    'samtools.iobio.io', 
                    ['view', '-b', '-h', 'http://s3.amazonaws.com/iobio/jasmine_files/test.bam', '1'], 
                    { 'urlparams': {'encoding':'binary'} })
                .pipe( 'bamtools.iobio.io', ['convert', '-format', 'json'] );

        cmdPipe.on('error', function(error) { /*ignore error*/ })
        cmdPipe.run();
        beforeEach(function(done) {
            cmdPipe.on('data', function(d) {                
                data = JSON.parse(d).name;
                done();
            })
        },20000);
        it("piped url command", function() {
            expect(data).toEqual('ERR194147.602999777');                        
        });
    });

    describe("Execute", function() {
        var data;        
        var sam = "@HD\tVN:1.3\tSO:coordinate\n@SQ\tSN:1\tLN:249250621\n@RG\tID:ERR194147\tLB:NA12878_1\tPL:ILLUMINA\tPU:ILLUMINA-1\tSM:NA12878\nERR194147.602999777 147 1   11919   0   101M    =   11675   -345\   ATTTGCTGTCTCTTAGCCCAGACTTCCCGTGTCCTTTCCACCGGGCCTTTGAGAGGTCACAGGGTCTTGATGCTGTGGTCTTCATCTGCAGGTGTCTGACT   B@>CEIIIJJJJGHJIGGIIGDIEHFFCFHFGHIFFHEFCE@BBEBECDFDDDDBEDGEFEABEDEBDCDDEFEDDADCDBCEDCDDDECBDEDEECB?AA   MC:Z:101M   BD:Z:KBKOSRLQNONMLMPPKOOKONLLMJLLIINMNLBLMNIMLLJNNMKAJLJJJLMMMHHNLIMMKKJLMLNONHHMMMKKKMMLKNNNOMNIJONRPONJJ  MD:Z:101    PG:Z:MarkDuplicates RG:Z:ERR194147  BI:Z:OFMQTTNRPRPQOQRRMQRORQONPLNPLLPPOOFNPPLPNNLPQOOFMPLNKONOPKKPOKNOMNLOOOPQQKKPNOMNMPPOMQPPPOOLLPOSRQQMM  NM:i:0  MQ:i:0  AS:i:101    XS:i:101\n";
        var file = new Blob([sam]);         

        var cmdFile = new iobio.cmd('samtools.iobio.io', ['view', '-S', '-H', file]);
        cmdFile.on('error', function(error) { /*ignore error*/ })
        cmdFile.run();
        beforeEach(function(done) {
            cmdFile.on('data', function(d) {
                data = d.split("\t").join("").split("\n").join("");
                done();
            })
        },20000);
        it("simple file command", function() {            
            expect(data).toEqual("@HDVN:1.3SO:coordinate@SQSN:1LN:249250621@RGID:ERR194147LB:NA12878_1PL:ILLUMINAPU:ILLUMINA-1SM:NA12878");
        });
    });

    describe("Execute", function() {
        var data;        
        var sam = "@HD\tVN:1.3\tSO:coordinate\n@SQ\tSN:1\tLN:249250621\n@RG\tID:ERR194147\tLB:NA12878_1\tPL:ILLUMINA\tPU:ILLUMINA-1\tSM:NA12878\nERR194147.602999777 147 1   11919   0   101M    =   11675   -345\   ATTTGCTGTCTCTTAGCCCAGACTTCCCGTGTCCTTTCCACCGGGCCTTTGAGAGGTCACAGGGTCTTGATGCTGTGGTCTTCATCTGCAGGTGTCTGACT   B@>CEIIIJJJJGHJIGGIIGDIEHFFCFHFGHIFFHEFCE@BBEBECDFDDDDBEDGEFEABEDEBDCDDEFEDDADCDBCEDCDDDECBDEDEECB?AA   MC:Z:101M   BD:Z:KBKOSRLQNONMLMPPKOOKONLLMJLLIINMNLBLMNIMLLJNNMKAJLJJJLMMMHHNLIMMKKJLMLNONHHMMMKKKMMLKNNNOMNIJONRPONJJ  MD:Z:101    PG:Z:MarkDuplicates RG:Z:ERR194147  BI:Z:OFMQTTNRPRPQOQRRMQRORQONPLNPLLPPOOFNPPLPNNLPQOOFMPLNKONOPKKPOKNOMNLOOOPQQKKPNOMNMPPOMQPPPOOLLPOSRQQMM  NM:i:0  MQ:i:0  AS:i:101    XS:i:101\n";
        var file = new Blob();          

        var cmdFile2 = new iobio.cmd('samtools.iobio.io', ['view', '-S', '-H', file], { writeStream: function(stream, done) {            
            stream.write(sam);
            done();
        }});  
        cmdFile2.on('error', function(error) { /*ignore error*/ })          
        
        beforeEach(function(done) {
            cmdFile2.on('data', function(d) {
                data = d.split("\t").join("").split("\n").join("");                
                done();
            })
        },20000);
        cmdFile2.run(); 
        it("sends file data via writestream to file command", function() {            
            expect(data).toEqual("@HDVN:1.3SO:coordinate@SQSN:1LN:249250621@RGID:ERR194147LB:NA12878_1PL:ILLUMINAPU:ILLUMINA-1SM:NA12878");
        });
    });
});

