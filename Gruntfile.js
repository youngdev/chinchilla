module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    watch: {
        src: {
            files: ['frontend/scripts/*', '!frontend/scripts/app.min.js'],
            tasks: ['concat']
        },
        backend: {
            files: ['routes/*', 'sites/*', 'db/*', 'config/*', 'auth/*'],
            tasks: ['forever:restart']
        },
        css: {
            files: ['frontend/styles/*.less'],
            tasks: ['less']
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
        dest: 'frontend/scripts/app.min.js'
      }
    },
    forever: {
    	options: {
    		index: 'app.js'
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
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-forever');
  grunt.registerTask('default', ['concat', 'less']);
};