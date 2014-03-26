var gulp = require('gulp'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    header = require('gulp-header'),
    footer = require('gulp-footer');


gulp.task('build-js', function () {
    gulp.src(['src/ngSails.js', 'src/**/*.js'])
        .pipe(concat('angular-sails.js'))
        .pipe(header('(function (angular, io) {\n\'use strict\''))
        .pipe(footer('}(angular, io));'))
        .pipe(gulp.dest('./dist/'))
        .pipe(concat('angular-sails.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', ['build-js']);
});

gulp.task('default', ['build-js', 'watch']);
