module.exports = function(grunt) {

	var module = 'slash.bdigital';

	function objectWithKeyValue(key, value){
		var ret = {};
		ret[key] = value;
		return ret;
	}

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),

		ngtemplates: {
			app: {
				cwd: "www",
				src: ["app/**/*.html", "shared/**/*.html"],
				dest: "www/build/templates.js",
				options: {
					htmlmin: {
						collapseBooleanAttributes:      true,
						collapseWhitespace:             true,
						removeAttributeQuotes:          true,
						removeComments:                 true,
						removeEmptyAttributes:          true,
						removeScriptTypeAttributes:     true,
						removeStyleLinkTypeAttributes:  true
					},
					module: module
				}
			}
		},
		
		concat: {
			js: {
				files: {
					'www/build/app.js': ['www/app/app.js', 'www/app/**/*.js'],
					'www/build/shared.js': ['www/shared/**/*.js']
				}
			},
			all: {
				files: objectWithKeyValue('www/build/' + module + '.js', [
					'www/build/app.js',
					'www/build/shared.js',
					'www/build/templates.js'
				])
			},
			dependencies: {
				files: objectWithKeyValue('www/build/' + module + '.min.js', [
					'www/lib/ionic/js/ionic.bundle.min.js',
					'www/lib/angular-translate/angular-translate.min.js',
					'www/lib/angular-translate/angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
					'www/build/' + module + '.min.js'
				])
			}
		},

		ngAnnotate: {
			js: {
				files: objectWithKeyValue('www/build/' + module + '.js', ['www/build/' + module + '.js'])
			}
		},

		uglify: {
			js: {
				files: objectWithKeyValue('www/build/' + module + '.min.js', ['www/build/' + module + '.js'])
			}
		},

		clean: {
			js: ['www/build/*.js', "!www/build/" + module + ".min.js"]
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-ng-annotate');
	grunt.loadNpmTasks('grunt-angular-templates');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-ftp-push');

	// Default task(s).
	grunt.registerTask('default', ['ngtemplates', 'concat:js', 'concat:all', 'ngAnnotate', 'uglify', 'concat:dependencies', 'clean']);

};