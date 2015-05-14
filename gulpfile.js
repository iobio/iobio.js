'use strict';

var browserify = require('browserify'),
	gulp = require('gulp'),
	source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),
	uglify = require('gulp-uglify'),
	sourcemaps = require('gulp-sourcemaps');

gulp.task('default', function() {
  // place code for your default task here
});

gulp.task('clean', function() {
	rimraf.sync('./dist/js');	
})

gulp.task('js-debug', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './src/cmd.js',
    debug: true
  });

  return b.bundle()
    .pipe(source('iobio.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))        
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./'));
});


gulp.task('js', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: './src/cmd.js',
    debug: false
  });

  return b.bundle()
    .pipe(source('iobio.min.js'))
    .pipe(buffer())    
        // Add transformation tasks to the pipeline here.
        .pipe(uglify())          
    .pipe(gulp.dest('./'));
});

gulp.task('buildAll', ['js', 'js-debug']);
 
gulp.task('default', ['js']);

