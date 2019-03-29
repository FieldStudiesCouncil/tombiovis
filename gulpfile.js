var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pump = require('pump');
var rename = require("gulp-rename");
var cleanCSS = require('gulp-clean-css');

gulp.task('minify', function (cb) {
    pump([
        gulp.src(['identikit/tombio/**/*.js', '!identikit/tombio/dependencies/**/*.js', '!identikit/tombio/min/js/*.js']),
        uglify(),
        rename(function (path) {
            path.dirname = "";
            path.extname = ".min.js";
        }),
        gulp.dest('identikit/tombio/min/js')
    ],cb);
});

gulp.task('mincss', function (cb) {
    pump([
        gulp.src(['identikit/tombio/**/*.css', '!identikit/tombio/dependencies/**/*.css', '!identikit/tombio/min/css/*.css']),
        cleanCSS(),
        rename(function (path) {
            path.dirname = "";
            path.extname = ".min.css";
        }),
        gulp.dest('identikit/tombio/min/css')
    ], cb);
});

gulp.task('onsenjs', function (cb) {
    //This is required because a change has been made to onsenui to generate an event
    //when expandable list item is expanded.
    pump([
        gulp.src(['identikit/tombio/dependencies/onsenui-2.10.3/js/onsenui.js']),
        uglify(),
        rename(function (path) {
            path.dirname = "";
            path.extname = ".min.js";
        }),
        gulp.dest('identikit/tombio/dependencies/onsenui-2.10.3/js')
    ], cb);
});

gulp.task('onsencss', function (cb) {
    //This is required because a change has been made to onsenui CSS to fix scrolling issues.
    pump([
        gulp.src(['identikit/tombio/dependencies/onsenui-2.10.3/css/onsenui.css']),
        cleanCSS(),
        rename(function (path) {
            path.dirname = "";
            path.extname = ".min.css";
        }),
        gulp.dest('identikit/tombio/dependencies/onsenui-2.10.3/css')
    ], cb);
});

gulp.task('default', ['minify', 'mincss', 'onsenjs', 'onsencss']);