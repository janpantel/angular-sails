'use strict';

var gulp = require('gulp');
var to5ify = require("6to5ify");
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var minifyify = require('minifyify');
var ngAnnotate = require('browserify-ngannotate');
var debowerify = require('debowerify');
var glob = require('glob');
var _ = require('lodash');
var gulpKarma = require('gulp-karma');
var pkg = require('./package.json');
var files = require('./files');

var karmaTestConfig = gulpKarma({configFile: 'karma.conf.js', action: 'run'});


gulp.task('js', function () {

    var b = browserify({debug: true})
        .transform(to5ify)
        .require('')
        .transform(ngAnnotate)
        .plugin('minifyify', {output: './build/'+pkg.name+'.min.map.json', map: pkg.name+'.map.json'});
    return b.bundle()
    .pipe(source(pkg.name+'.min.js'))
    .pipe(gulp.dest('./build/'));
});
gulp.task('dist', ['build-js'], function () {
    return gulp.src('./build/*.*')
    .pipe(gulp.dest('./dist/'));
});

gulp.task('test', function () {
    return gulp.src(files.mergeFilesFor('karma-src')).pipe(karmaTestConfig);
});

gulp.task('test-build', ['build-js'], function () {
    return gulp.src(files.mergeFilesFor('karma-build')).pipe(karmaTestConfig);
});

gulp.task('test-min', ['build-js'], function () {
    return gulp.src(files.mergeFilesFor('karma-min')).pipe(karmaTestConfig);
});

gulp.task('watch', function () {
    return gulp.watch('src/**/*.js', ['build-js']);
});

gulp.task('default', ['build-js', 'watch']);
