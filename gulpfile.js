var isDev = false
var port = 8080
var isLivereload = false
    //var  isLivereload = true
var gulp = require('gulp')
var connect //= require('gulp-connect')
var watch // = require('gulp-watch')
var imageReg = ['src/**/*.jpg', 'src/**/*.png', 'src/**/*.jpeg', 'src/**/*.svg']


gulp.task('httpServer', function() {
    connect = require('gulp-connect')

    connect.server({
        port: port,
        livereload: isLivereload,
        // dev-build 为了让server 访问到css
        root: ['src', 'dev-build']
    })
})


function lessTask(dest) {
    return function() {
        var less = require('gulp-less')
        var LessPluginAutoPrefix = require('less-plugin-autoprefix')
        var autoprefix = new LessPluginAutoPrefix({ browsers: ["android > 2", 'iOS > 5'] })
        var plugins = [autoprefix]

        if (isDev === false) {
            // css minifier
            var LessPluginCleanCSS = require('less-plugin-clean-css')
            var cleancss = new LessPluginCleanCSS({ advanced: true })
            plugins.push(cleancss)
        }

        gulp.src("src/**/*.less")
            .pipe(less({
                plugins: plugins
            }))
            .pipe(gulp.dest(dest))
    }
}
// 把css输出到src原目录下，文件太多，很烦，还是弄到别的目录
gulp.task('lessDev', lessTask('dev-build'))
gulp.task('lessDist', lessTask('dist'))


gulp.task('watch', function(cb) {
    watch = require('gulp-watch')
    gulp.watch("src/**/*.less", ['lessDev'])
    gulp.watch(imageReg, ['imageMinDev'])
})


gulp.task('livereload', function() {
    gulp.src(['src/**/*.less', 'src/**/*.html', 'src/**/*.js'])
        // .pipe(watch())
        // .pipe(watch('src/**/*.less'))
        .pipe(watch('dev-build/**/*.css'))
        .pipe(watch('src/**/*.js'))
        .pipe(connect.reload())
})


function delTask(path) {
    return function() {
        var del = require('del')
            // del.sync(['dist', 'dev-build'])
        return del(path)
    }
}
gulp.task('delDev', delTask(['dev-build']))
gulp.task('delDist', delTask(['dist']))


gulp.task('compress', function() {
    var uglify = require('gulp-uglify')

    return gulp.src('src/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('dist'))
})


function imageMinTask(path) {
    return function() {
        var imagemin = require('gulp-imagemin')

        return gulp.src(imageReg)
            .pipe(imagemin({
                progressive: true
            }))
            .pipe(gulp.dest(path))
    }
}
gulp.task('imageMinDev', imageMinTask('dev-build'))
gulp.task('imageMinDist', imageMinTask('dist'))


gulp.task('copy', function() {
    var src = ['src/**/*', '!**/*.js', '!**/*.less']

    var imageOut = imageReg.map(function(el) {
        return '!' + el
    })

    src = src.concat(imageOut)

    return gulp.src(src)
        .pipe(gulp.dest('dist'))
})


gulp.task('dev', function(callback) {
    var runSequence = require('run-sequence')

    // 获取命令行参数
    // console.log(process.argv[2])

    isDev = true
    var devTask = ['lessDev', 'imageMinDev', 'watch', 'httpServer']

    if (isLivereload) {
        devTask.push('livereload')
    }

    runSequence('delDev', devTask, callback)
})


gulp.task('dist', function(callback) {
    var runSequence = require('run-sequence')

    // runSequence 字符串参数的任务，顺序执行，
    // 数组参数的任务，会并行执行
    // callback 是要有的，不然 runSequence 不知道什么时候结束
    runSequence('delDist', 'copy', ['compress', 'lessDist', 'imageMinDist'], callback)
})


gulp.task('zip', () => {
    const zip = require('gulp-zip')
    return gulp.src('dist/**/*')
        .pipe(zip('dist.zip'))
        .pipe(gulp.dest(''))
})
