'use strict';

var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    footer = require('gulp-footer'),
    ngAnnotate = require('gulp-ng-annotate'),
    gulpKarma = require('gulp-karma'),
    pkg = require('./package.json'),
    files = require('./files');

var karmaTestConfig = gulpKarma({configFile: 'karma.conf.js', action: 'run'});


gulp.task('build-js', function () {
    return gulp.src(files.mergeFilesFor('src'))
        .pipe(ngAnnotate())
        .pipe(concat(pkg.name+'.js'))
        .pipe(header('(function (angular, io) {\n\'use strict\''))
        .pipe(footer('}(angular, io));'))
        .pipe(gulp.dest('./build/'))
        .pipe(concat(pkg.name+'.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./build/'));
});

gulp.task('dist-js', ['build-js'], function () {
    return gulp.src('./build/*.js')
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
