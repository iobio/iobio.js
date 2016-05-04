# iobio.js [![Build Status](https://travis-ci.org/iobio/iobio.js.svg?branch=master)](https://travis-ci.org/iobio/iobio.js) [![Coverage Status](https://coveralls.io/repos/iobio/iobio.js/badge.svg?branch=master)](https://coveralls.io/r/iobio/iobio.js?branch=master)
Handles the websocket code and makes creating iobio commands easier.

## Use

To use simply download iobio.min.js and include in your html

## Create Command
A new command takes 3 arguments
* iobio webservice
* array of arguments for the tool
* hash of options

```javascript
 // create command using the same arguments as the original tool
 var cmd = new iobio.cmd(
		'samtools.iobio.io',
		['view', '-H', 'http://s3.amazonaws.com/iobio/NA12878/NA12878.autsome.bam']
	);

 // retrieve the url for this command
 cmd.http();
 // You can curl the command to make sure it's working
 // curl "http://samtools.iobio.io/?cmd=view%20-H%20http://s3.amazonaws.com/iobio/NA12878/NA12878.autsome.bam"			

 // Catch data event when fired and use results
 cmd.on('data', function(results) {
	// do stuff with results here
 })

 // Catch error event when fired 
 // It's important to catch error events or your iobio command will probably throw an error and fail as 
 // some programs write to stderr and will bubble up the chain back here.
 cmd.on('error', function(error) {
	// handle or log error
 })

 // execute command
 cmd.run();
```

### Options
* SSL[true] - uses ssl to run command either https or wss depending on the protocol
* urlparams[hash] - hash that becomes the url parameters in the iobio url. These parameters get passed to the server.

## Chain Commands

```javascript
 var cmd = new iobio.cmd(
		'samtools.iobio.io',
		['view', '-b', '-h', 'http://s3.amazonaws.com/iobio/NA12878/NA12878.autsome.bam', '1:6864420-6869420'],
		{ 'urlparams': {'encoding':'binary'} })
	.pipe( 'bamtools.iobio.io', ['convert', '-format', 'json'] ); // chain command

 // Run like normal
 cmd.run(); 

 // Use Results
 cmd.on('data', function(results) {
	// do stuff with results here
 })
```

## Use local files

#### Read Whole File

```javascript
 // Get object file from prompt
 var cmd = new iobio.cmd('samtools', ['view', '-S', file]);			

 // Use results
 cmd.on('data', function(d) {
	// do stuff with results here
 })

 // Run like normal
 cmd.run();
```

#### Read Part of File

```javascript
 // Get object file from prompt
 var blob = file.slice(0, 2000);
 var cmd = new iobio.cmd('samtools', ['view', '-S', blob]);			

 // Use results
 cmd.on('data', function(d) {
	// do stuff with results here
 })

 // Run like normal
 cmd.run();
```

#### Finer Control With A Callback

```javascript
 // When you need to do something more complex or flexible, you can 
 // request to get a write stream back from the server to write data to
 var cmd = new iobio.cmd(
 			'samtools', 
 			['view', '-S', file], 
 			{ 
 				writeStream: function(stream) {  // stream to write to				
                	chunks.forEach(function(chunk) {
                		stream.write(chunk);
                	})
                	stream.end(); // make sure to end stream when finished 
 				}          		  // or results may be unpredictable
 			}
 		);			

 // Use results
 cmd.on('data', function(d) {
	// do stuff with results here
 })

 // Run like normal
 cmd.run();
```

## Working With The Queue
To ensure that our servers aren't overwhelmed we only run a set number of concurrent
requests. Additional requests are put in a queue and processed in order of reception.
To keep users informed we send events for when a request is put into a queue and updates
for when the request moves up the queue

```javascript
	// handle queue updates
	cmd.on('queue', function(q) {
	  // FILL IN HOW TO USE
	})
```

## Troubleshooting
The best way to troubleshoot is to see what errors you are getting back from the webservices

```javascript
	// print errors if any
	cmd.on('error', function(e) {
		console.log('error = ' + e);
	})

	// you can also get more info by using a url parameter of debug=true
	var cmd = new iobio.cmd(
		'samtools.iobio.io',
		['view', '-H', 'http://s3.amazonaws.com/iobio/NA12878/NA12878.autsome.bam'],
		{ 'urlparams': {'debug':'true'} }
	);
	// now when you read error events you'll get errors and the debug log
```

## Developers

#### Download 
To get going you need to clone the repo from github
```
git clone https://github.com/iobio/iobio.js.git
```

#### Install Dependencies
This will install all needed node modules
```
cd iobio.js; npm install
```


#### Build JS
This will create a single development js file from everything in the ```src``` directory with sourcemaps for debugging.
```
gulp js-debug
```

This will create a single minified js file (ready for production) from everything in the ```src``` directory.
```
gulp js
```

#### Run tests
Runs all tests found in the ```test``` directory
```
gulp test
```
