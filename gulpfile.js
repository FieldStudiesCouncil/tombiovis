var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require("gulp-rename");
var cleanCSS = require('gulp-clean-css');

gulp.task('minify', function (cb) {
    pump([
        gulp.src(['tombio/**/*.js', '!tombio/dependencies/**/*.js', '!tombio/min/js/*.js']),
        uglify(),
        rename(function (path) {
            path.dirname = "";
            path.extname = ".min.js";
        }),
        gulp.dest('min/js')
    ],cb);
});

gulp.task('mincss', function (cb) {
    pump([
        gulp.src(['tombio/**/*.css', '!tombio/dependencies/**/*.css', '!tombio/min/css/*.css']),
        cleanCSS(),
        rename(function (path) {
            path.dirname = "";
            path.extname = ".min.css";
        }),
        gulp.dest('min/css')
    ], cb);
});

gulp.task('default', ['minify', 'mincss']);