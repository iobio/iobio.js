'use strict';

var iobio = require('../src/cmd.js'),
    samtools = 'nv-prod.iobio.io/samtools/',
    bamtools = 'nv-prod.iobio.io/bamtools/';

describe("Command", function() {



    describe("URL generation", function() {
        var cmd = new iobio.cmd(samtools, ['view', 'http://s3.amazonaws.com/iobio/jasmine_files/test.bam', '1']);
        it("creates an iobio url", function() {
          var url = cmd.url().split('&id')[0];
          expect(url).toEqual('iobio://' + samtools + '?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });

        it("creates a http url", function() {
          var url = cmd.http().split('&id')[0];
          expect(url).toEqual('http://' + samtools + '?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });

        it("creates a https url", function() {
          var url = cmd.https().split('&id')[0];
          expect(url).toEqual('https://' + samtools + '?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });

        it("creates a websocket url", function() {
          var url = cmd.ws().split('&id')[0];
          expect(url).toEqual('ws://' + samtools + '?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });

        it("creates a secure websocket url", function() {
          var url = cmd.wss().split('&id')[0];
          expect(url).toEqual('wss://' + samtools + '?cmd=view%20http://s3.amazonaws.com/iobio/jasmine_files/test.bam%201');
        });
    });

    describe("Execute", function() {
        var end, start, data, exitCode;
        beforeAll(function(done) {
            var cmd1 = new iobio.cmd(samtools, ['view', 'http://s3.amazonaws.com/iobio/jasmine_files/test.bam', '1']);
            // Catch events
            cmd1.on('error', function(error) { /*ignore errors*/ })
                .on('start', function(d) { start = true; })
                .on('data', function(d) { data = d.split('\t')[0]; })
                .on('exit', function(code) { exitCode = code; })
                .on('end', function(d) {
                    end = true;
                    done();
                })
                .run();
        },20000);

        describe("events", function() {
            it("emits 'start' event", function() {
                expect(start).toBe(true);
            });

            it("emits 'end' event", function() {
                expect(end).toBe(true);
            });

            // it("emits 'exit' event", function() {
            //     expect(exitCode).toEqual(0);
            // });
        })

        describe("results", function() {
            it("simple url command", function() {
                expect(data).toEqual('ERR194147.602999777');
            });
        });

    });

    describe("Execute", function() {
        var data;
        beforeAll(function(done) {
            var cmd = new iobio.cmd(samtools, ['view', 'http://s3.amazonaws.com/iobio/jasmine_files/test.bam', '1'], {ssl:true});
            cmd.on('error', function(error) { /*ignore errors*/ })
            cmd.on('data', function(d) {
                data = d.split('\t')[0];
                done();
            })
            cmd.run();
        },20000);
        it("simple url command with ssl", function() {
            expect(data).toEqual('ERR194147.602999777');
        });
    });

    describe("Execute", function() {
        var data;
        beforeAll(function(done) {
            var cmdPipe = new iobio.cmd(
                    samtools,
                    ['view', '-b', '-h', 'http://s3.amazonaws.com/iobio/jasmine_files/test.bam', '1'],
                    { 'urlparams': {'encoding':'binary'} })
                .pipe( bamtools, ['convert', '-format', 'json'] );

            cmdPipe.on('error', function(error) { /*ignore error*/ })
            cmdPipe.on('data', function(d) {
                data = JSON.parse(d).name;
                done();
            })
            cmdPipe.run();
        },20000);
        it("piped url command", function() {
            expect(data).toEqual('ERR194147.602999777');
        });
    });

    describe("Execute", function() {
        var data;
        beforeAll(function(done) {
            var sam = "@HD\tVN:1.3\tSO:coordinate\n@SQ\tSN:1\tLN:249250621\n@RG\tID:ERR194147\tLB:NA12878_1\tPL:ILLUMINA\tPU:ILLUMINA-1\tSM:NA12878\nERR194147.602999777 147 1   11919   0   101M    =   11675   -345\   ATTTGCTGTCTCTTAGCCCAGACTTCCCGTGTCCTTTCCACCGGGCCTTTGAGAGGTCACAGGGTCTTGATGCTGTGGTCTTCATCTGCAGGTGTCTGACT   B@>CEIIIJJJJGHJIGGIIGDIEHFFCFHFGHIFFHEFCE@BBEBECDFDDDDBEDGEFEABEDEBDCDDEFEDDADCDBCEDCDDDECBDEDEECB?AA   MC:Z:101M   BD:Z:KBKOSRLQNONMLMPPKOOKONLLMJLLIINMNLBLMNIMLLJNNMKAJLJJJLMMMHHNLIMMKKJLMLNONHHMMMKKKMMLKNNNOMNIJONRPONJJ  MD:Z:101    PG:Z:MarkDuplicates RG:Z:ERR194147  BI:Z:OFMQTTNRPRPQOQRRMQRORQONPLNPLLPPOOFNPPLPNNLPQOOFMPLNKONOPKKPOKNOMNLOOOPQQKKPNOMNMPPOMQPPPOOLLPOSRQQMM  NM:i:0  MQ:i:0  AS:i:101    XS:i:101\n";
            var file = new Blob([sam]);

            var cmdFile = new iobio.cmd(samtools, ['view', '-S', '-H', file]);
            cmdFile.on('error', function(error) { /*ignore error*/ })
            cmdFile.on('data', function(d) {
                data = d.split("\t").join("").split("\n").join("");
                done();
            })
            cmdFile.run();
        },20000);
        it("simple file command", function() {
            expect(data).toEqual("@HDVN:1.3SO:coordinate@SQSN:1LN:249250621@RGID:ERR194147LB:NA12878_1PL:ILLUMINAPU:ILLUMINA-1SM:NA12878");
        });
    });

    describe("Execute", function() {
        var data;
        beforeAll(function(done) {
            var sam = "@HD\tVN:1.3\tSO:coordinate\n@SQ\tSN:1\tLN:249250621\n@RG\tID:ERR194147\tLB:NA12878_1\tPL:ILLUMINA\tPU:ILLUMINA-1\tSM:NA12878\nERR194147.602999777 147 1   11919   0   101M    =   11675   -345\   ATTTGCTGTCTCTTAGCCCAGACTTCCCGTGTCCTTTCCACCGGGCCTTTGAGAGGTCACAGGGTCTTGATGCTGTGGTCTTCATCTGCAGGTGTCTGACT   B@>CEIIIJJJJGHJIGGIIGDIEHFFCFHFGHIFFHEFCE@BBEBECDFDDDDBEDGEFEABEDEBDCDDEFEDDADCDBCEDCDDDECBDEDEECB?AA   MC:Z:101M   BD:Z:KBKOSRLQNONMLMPPKOOKONLLMJLLIINMNLBLMNIMLLJNNMKAJLJJJLMMMHHNLIMMKKJLMLNONHHMMMKKKMMLKNNNOMNIJONRPONJJ  MD:Z:101    PG:Z:MarkDuplicates RG:Z:ERR194147  BI:Z:OFMQTTNRPRPQOQRRMQRORQONPLNPLLPPOOFNPPLPNNLPQOOFMPLNKONOPKKPOKNOMNLOOOPQQKKPNOMNMPPOMQPPPOOLLPOSRQQMM  NM:i:0  MQ:i:0  AS:i:101    XS:i:101\n";

            var writeStream = function(stream, done) {
                stream.write(sam);
                done();
            }

            var cmdFile2 = new iobio.cmd(samtools, ['view', '-S', '-H', writeStream]);
            cmdFile2.on('error', function(error) { /* ignore error */ })
            cmdFile2.on('data', function(d) {
                data = d.split("\t").join("").split("\n").join("");
                done();
            })
            cmdFile2.run(); 
        },20000);

        it("sends file data via function to file command", function() {
            expect(data).toEqual("@HDVN:1.3SO:coordinate@SQSN:1LN:249250621@RGID:ERR194147LB:NA12878_1PL:ILLUMINAPU:ILLUMINA-1SM:NA12878");
        });
    });

    describe("Execute", function() {
        var data = [];
        beforeAll(function(done) {
            var file1 = "iobio://s3.amazonaws.com/iobio/jasmine_files/test.bam";
            var file2 = "iobio://s3.amazonaws.com/iobio/jasmine_files/test2.bam";

            var cmdFile = new iobio.cmd(samtools , ['merge', '-', file1, file2], {urlparams: {protocol:'http', encoding:'binary'} })
                .pipe(samtools, ['view', '-'])
            cmdFile.on('error', function(error) { /*ignore error*/ })
            cmdFile.on('data', function(d) {
                d.split("\n").forEach(function(record) {
                    if (record != "")
                        data.push(record.split("\t")[0]);
                })
            })
            cmdFile.on('end', function() {
                done();
            })
            cmdFile.run();
        },20000);
        it("file command with 2 files", function() {
            expect(data.join('-')).toEqual("ERR194147.602999777-ERR194147.602999778");
        });
    });
});

