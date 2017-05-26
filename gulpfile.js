
var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');
var clean = require('gulp-clean');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var wiredep = require('gulp-wiredep');
var useref = require('gulp-useref');
var browserSync = require('browser-sync').create();

// Задача с названием 'default' запускается автоматически по команде 'gulp' в консоле.
// Эта конструкция работает синхронно, сначала выполняется задача 'clean' и только после ее завершнения запускается 'dev'.
gulp.task('default', ['clean'], function() {
	console.log("ПОШЕЛ В ЖОПУ! Я устарел:( ПИШИ - 'gulp dev' ")
});

// Задача 'dev' представляется собой сборку в режиме разработки.
// Запускает build - сборку, watcher - слежку за файлами и browser-sync.
gulp.task('dev', ['build', 'watch', 'browser-sync']);
// Задача 'build' представляет собой сборку в режиме продакшен.
// Собирает проект.
gulp.task('build', [ 'styles', 'scripts', 'html', 'assets']);
// Задача 'watch' следит за всеми нашими файлами в проекте и при изменении тех или иных перезапустает соответсвующую задачу.
gulp.task('watch', function() {
	gulp.watch('dev/css/**/*.scss', ['styles']); //стили
    gulp.watch('dev/js/**/*.js', ['scripts']); //скрипты
    gulp.watch(['./bower.json', 'dev/index.html'], ['html']); // html
    gulp.watch('./dev/assets/**/*.*', ['assets']); //наши локальные файлы(картинки, шрифты)
    gulp.watch('dev/**/*.*').on('change', browserSync.reload); //Перезапуск browserSynс
});
// Задача 'styles' выполняет сборку наших стилей.
gulp.task('styles', function() {
	return gulp.src('dev/css/**/*.scss')
		.pipe(sourcemaps.init()) //История изменения стилей, которая помогает нам при отладке в devTools.
		.pipe(sass()) //Компиляция sass.
		.pipe(autoprefixer())
		.pipe(concat('style.min.css')) //Соедение всех файлом стилей в один и задание ему названия 'styles.css'.
    .pipe(plumber({ // plumber - плагин для отловли ошибок.
			errorHandler: notify.onError(function(err) { // nofity - представление ошибок в удобном для вас виде.
				return {
					title: 'Styles',
					message: err.message
				}
			})
		}))
		.pipe(cssnano()) //Минификация стилей
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/css'));
});
//Задача для удаление папки build.
gulp.task('clean', function() {
	return gulp.src('dist/')
		.pipe(clean());
})

gulp.task('html', function() {
	gulp.src('dev/index.html')
		.pipe(wiredep({ //Добавление ссылок на плагины bower.
			directory: 'bower_components/'
		}))
		.pipe(gulp.dest('dist/'))
		.on('end', function() { //запуск задачу 'useref' по завершению задачи 'html'.
			return gulp.src('dist/index.html')
			.pipe(useref()) //Выполняет объединение файлов в один по указанным в разметке html комментариев.
			.pipe(gulp.dest('dist/'));
		});
});

gulp.task('scripts', function() {
	gulp.src('dev/js/*.js')
		.pipe(uglify()) //Минификация скриптов.
		.pipe(gulp.dest('dist/js'));
});
//Задача для запуска сервера.
gulp.task('browser-sync', function() {
	return browserSync.init({
		server: {
			baseDir: './dist/'
		}
	});
});
//Перемешение наших локальных файлов в папку build
gulp.task('assets', function() {
	return gulp.src('./dev/assets/**/*.*')
		.pipe(gulp.dest('./dist/assets/'));
});


//////////////////////
/////SVG/////////////


var svgSprite = require('gulp-svg-sprite'),
  svgmin = require('gulp-svgmin'),
  cheerio = require('gulp-cheerio'),
  replace = require('gulp-replace');

var config = {
  mode: {
    symbol: {
      sprite: "../../sprite.svg",
      render: {
        scss: {
          dest: '../../../../css/sprite.scss'
        }
      }
    }
  }
};

gulp.task('svgSpriteBuild', function() {
  return gulp.src('./dev/assets/img/i/*.svg')
    // минифицируем svg
    .pipe(svgmin({
      js2svg: {
        pretty: true
      }
    }))
    // удалить все атрибуты fill, style and stroke в фигурах
    .pipe(cheerio({
      run: function($) {
        $('[fill]').removeAttr('fill');
        $('[stroke]').removeAttr('stroke');
        $('[style]').removeAttr('style');
      },
      parserOptions: { xmlMode: true }
    }))
    // cheerio плагин заменит, если появилась, скобка '&gt;', на нормальную.
    .pipe(replace('&gt;', '>'))
    // build svg sprite
    .pipe(svgSprite(config))
    .pipe(gulp.dest('./dev/assets/img/sprite/'));
});