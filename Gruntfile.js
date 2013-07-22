module.exports = function(grunt) {
  grunt.initConfig({
    watch: {
        src: {
            files: ['frontend/scripts/*', '!frontend/scripts/app.min.js'],
            tasks: ['concat', 'uglify']
        },
        backend: {
            files: ['routes/*', 'sites/*', 'db/*', 'config/*', 'auth/*']
        },
        less: {
            files: ['frontend/styles/*.less'],
            tasks: ['less'],
            options: {
              livereload: false
            }
        },
        css: {
            files: ['frontend/css/main.css'],
            options: {
              livereload: true
            }
        },
        options: {
            livereload: true
        }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
        'frontend/scripts/idbstore.js',
        'frontend/scripts/underscore.js',
        'frontend/scripts/helpers.js',
        'frontend/scripts/underscore.js',
        'frontend/scripts/helpers.js',
        'frontend/scripts/fetchFeeds.js',
        'frontend/scripts/navigation.js',
        'frontend/scripts/socket.io.js',
        'frontend/scripts/notifications.js',
        'frontend/scripts/sockets.js',
        'frontend/scripts/templates.js',
        'frontend/scripts/player.js',
        'frontend/scripts/search.js',
        'frontend/scripts/add-tracks.js',
        'frontend/scripts/import.js',
        'frontend/scripts/errors.js',
        'frontend/scripts/recognition.js',
        'frontend/scripts/swfobject.js',
        'frontend/scripts/libdom.js',
        'frontend/scripts/library.js',
        'frontend/scripts/UI.js',
        'frontend/scripts/pubsub.js',
        'frontend/scripts/local.js'
        ],
        dest: 'frontend/scripts/app.js'
      }
    },
    less: {
      production: {
        options: {
          yuicompress: true
        },
        files: {
            "frontend/css/main.css": "frontend/styles/main.less"
        }
      }
    },
    nodemon: {
      prod: {
        file: 'app.js',
        ignoredFiles: ['README.md', 'node_modules/**'],
        watchedFolders: ['routes', 'sites', 'db', 'config', 'auth'],
        watchedExtensions: ['js', 'html']
      }
    },
    concurrent: {
      target: {
        tasks: ['nodemon', 'watch'],
        options: {
          logConcurrentOutput: true
        },
        cwd: __dirname
      }
    },
    uglify: {
      target: {
        files: {
          'frontend/scripts/app.min.js': ['frontend/scripts/app.js']
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-concurrent');
  grunt.registerTask('default', ['concurrent']);
};