var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('build-js', function () {
  gulp.src('src/**/*.js')
    .pipe(concat('angular-sails.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/'));
});

gulp.task('watch', function () {
  gulp.watch('src/**/*.js', ['build-js']);
});

gulp.task('default', ['build-js', 'watch']);