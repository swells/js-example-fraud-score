var gulp       = require('gulp'),
    jshint     = require('gulp-jshint'),
    browserify = require('gulp-browserify'),
    server     = require('gulp-express'),
    unzip      = require('gulp-unzip');

gulp.task('deployr-deps', function(){  
  gulp.src('./.modules/*.zip')
    .pipe(unzip())
    .pipe(gulp.dest('./node_modules'))
})

// tasks
gulp.task('lint', function() {
  gulp.src(['!./client/app/js/bundled.js', 
    './client/app/**/*.js', 
    '!./client/app/bower_components/**/*',
      '!./client/app/js/vendor/**/*'])
    .pipe(jshint())
    .pipe(jshint.reporter('default'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('copy-bower-components', function () {
  gulp.src('./app/bower_components/**')
    .pipe(gulp.dest('dist/bower_components'));
});

gulp.task('copy-html-files', function () {
  gulp.src('./client/app/**/*.html')
    .pipe(gulp.dest('dist/'));
});

gulp.task('browserify', function() {
  gulp.src(['client/app/js/main.js'])
  .pipe(browserify({
    insertGlobals: true,
    debug: true
  }))
  .pipe(concat('bundled.js'))
  .pipe(gulp.dest('./client/app/js'))
});

gulp.task('browserifyDist', function() {
  gulp.src(['client/app/js/main.js'])
  .pipe(browserify({
    insertGlobals: true,
    debug: true
  }))
  .pipe(concat('bundled.js'))
  .pipe(gulp.dest('./dist/js'))
});

gulp.task('server', function () {
    //start the server at the beginning of the task
    server.run({
        file: 'app.js'
    });

    //restart the server when file changes
    gulp.watch(['client/app/**/*.html'], server.notify);
    gulp.watch(['client/app/js/**/*.js'], ['lint', 'browserify']);
    gulp.watch(['client/app/css/**/*.css']);
    gulp.watch(['app.js', 'server/routes/**/*.js'], [server.run]);
});

gulp.task('default', ['lint', 'browserify', 'server'] );
