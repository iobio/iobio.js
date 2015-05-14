# iobio.js
Handles the websocket code and the sometimes tricky process of creating iobio commands

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
		.then( 'bamtools.iobio.io', ['convert', '-format', 'json'] ); // chain command
	
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