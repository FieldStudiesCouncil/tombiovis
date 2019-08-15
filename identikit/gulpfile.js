let gulp = require("gulp");
let rename = require("gulp-rename");
let uglify = require('gulp-uglify-es').default;
let cleanCSS = require('gulp-clean-css');
 
gulp.task("js", function () {
    return gulp.src(['tombio/**/*.js', '!tombio/dependencies/**/*.js', '!tombio/min/js/*.js'])
        .pipe(rename(function(path){
            path.dirname = "";
            path.basename += ".min";
        }))
        .pipe(uglify(/* options */))
        .pipe(gulp.dest("tombio/min/js"));
});

gulp.task("onsenjs", function () {
    //This is required because a change has been made to onsenui to generate an event
    //when expandable list item is expanded.
    return gulp.src('tombio/dependencies/onsenui-2.10.10/js/onsenui.js')
        .pipe(rename(function(path){
            path.basename += ".min";
        }))
        .pipe(uglify(/* options */))
        .pipe(gulp.dest("tombio/dependencies/onsenui-2.10.10/js"));
});

gulp.task('css', function () {
    return gulp.src(['tombio/**/*.css', '!tombio/dependencies/**/*.css', '!tombio/min/css/*.css'])
        .pipe(rename(function(path){
            path.dirname = "";
            path.basename += ".min";
        }))
        .pipe(cleanCSS(/* options */))
        .pipe(gulp.dest("tombio/min/css"));
});

gulp.task("onsencss", function () {
    //This is required because a change has been made to onsenui CSS to fix scrolling issues.
    return gulp.src('tombio/dependencies/onsenui-2.10.10/css/onsenui.css')
        .pipe(rename(function(path){
            path.basename += ".min";
        }))
        .pipe(cleanCSS(/* options */))
        .pipe(gulp.dest("tombio/dependencies/onsenui-2.10.10/css"));
});

gulp.task('default', gulp.series('js', 'onsenjs', 'css', 'onsencss'));