# iobio.js [![Build Status](https://travis-ci.org/iobio/iobio.js.svg?branch=master)](https://travis-ci.org/iobio/iobio.js) [![Coverage Status](https://coveralls.io/repos/iobio/iobio.js/badge.svg?branch=master)](https://coveralls.io/r/iobio/iobio.js?branch=master)
Handles the websocket code and makes creating iobio commands easier.

## Use

To use simply download iobio.min.js and include in your html

## Create Command

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

 // execute command
 cmd.run();
```

## Chain Commands

```javascript
 var cmd = new iobio.cmd(
		'samtools.iobio.io',
		['view', '-b', '-h', 'http://s3.amazonaws.com/iobio/NA12878/NA12878.autsome.bam', '1:6864420-6869420'],
		{'encoding':'binary'})
	.pipe( 'bamtools.iobio.io', ['convert', '-format', 'json'] ); // chain command

 // Run like normal
 cmd.run(); 

 // Use Results
 cmd.on('data', function(results) {
	// do stuff with results here
 })
```

## Use local files

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