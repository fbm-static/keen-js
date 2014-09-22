var saucelabs = require('./config/saucelabs')(),
    aws = require('./config/aws')();

module.exports = function(grunt) {

  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks('grunt-s3');

  grunt.loadNpmTasks('grunt-saucelabs');

  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    concat: {
      options: {
        stripBanners: true,
        process: function(src, filepath) {
          var namespace = (grunt.option("namespace") || false);
          src = ((namespace) ? src.replace("'Keen'", "'" + namespace + "'") : src);
          return "  // Source: " + filepath + "\n" + src;
        }
      },

      // Build complete version
      all: {
        src: [
            "src/_intro.js"
          , "src/core.js"
          , "src/track.js"
          , "src/query.js"
          , "src/lib/base64.js"
          , "src/lib/json2.js"
          , "src/lib/keen-dataform.js"
          , "src/lib/keen-domready.js"
          , "src/lib/keen-spinner.js"
          , "src/visualize.js"
          , "src/plugins/keen-googlecharts.js"
          , "src/plugins/keen-widgets.js"
          , "src/async.js"
          , "src/_outro.js"
        ],
        dest: "dist/<%= pkg.name %>.js"
      },

      // Build complete version
      querying: {
        src: [
            "src/_intro.js"
          , "src/core.js"
          // , "src/track.js"
          , "src/query.js"
          // , "src/lib/base64.js"
          , "src/lib/json2.js"
          // , "src/lib/keen-dataform.js"
          , "src/lib/keen-domready.js"
          // , "src/lib/keen-spinner.js"
          // , "src/visualize.js"
          // , "src/plugins/keen-googlecharts.js"
          // , "src/plugins/keen-widgets.js"
          , "src/async.js"
          , "src/_outro.js"
        ],
        dest: "dist/<%= pkg.name %>-querying.js"
      },

      // Build tracking-only version
      tracker: {
        src: [
            "src/_intro.js"
          , "src/core.js"
          , "src/track.js"
          , "src/lib/base64.js"
          , "src/lib/json2.js"
          , "src/lib/keen-domready.js"
          , "src/async.js"
          , "src/_outro.js"
        ],
        dest: "dist/<%= pkg.name %>-tracker.js"
      },

      plugin_googlecharts: {
        src: ["src/plugins/_intro.js", "src/plugins/keen-googlecharts.js", "src/plugins/_outro.js"],
        dest: "dist/plugins/keen-googlecharts.js"
      },

      plugin_keenwidgets: {
        src: ["src/plugins/_intro.js", "src/plugins/keen-widgets.js", "src/plugins/_outro.js"],
        dest: "dist/plugins/keen-widgets.js"
      },

      loader: {
        src: "src/loader.js",
        dest: "dist/<%= pkg.name %>-loader.js"
      }
    },

    uglify: {
      options : {
        beautify : {
          ascii_only : true
        }
      },
      dist: {
        files: {
          "dist/<%= pkg.name %>.min.js": "dist/<%= pkg.name %>.js",
          "dist/<%= pkg.name %>-querying.min.js": "dist/<%= pkg.name %>-querying.js",
          "dist/<%= pkg.name %>-tracker.min.js": "dist/<%= pkg.name %>-tracker.js",
          "dist/<%= pkg.name %>-loader.min.js": "dist/<%= pkg.name %>-loader.js"
        }
      }
    },

    watch: {
      javascript: {
        files: "src/**/*.js",
        tasks: [ "concat", "uglify" ]
      }
    },

    connect: {
      server: {
        options: {
          base: 'test',
          port: 9999
        }
      }
    },

    'saucelabs-mocha': {
      all: {
        options: {
          testname: new Date().toISOString(),
          username: saucelabs.username,
          key: saucelabs.key,
          build: process.env.TRAVIS_JOB_ID,
          urls: saucelabs.urls,
          browsers: saucelabs.browsers,
          concurrency: saucelabs.concurrency,
          sauceConfig: {
            'video-upload-on-pass': false
          }
        }
      }
    },

    s3: {
      options: {
        key: aws.key,
        secret: aws.secret,
        bucket: aws.bucket,
        access: 'public-read',
        headers: {
          // Two Year cache policy (1000 * 60 * 60 * 1) // 1 hour
          "Cache-Control": "max-age=3600000, public",
          "Expires": new Date(Date.now() + 3600000).toUTCString()
        },
        gzip: true
      },
      release: {
        upload: [
          {
            src: 'dist/*',
            dest: 'latest/'
          },
          {
            src: 'dist/*',
            dest: '<%= pkg.version %>/'
          }
        ]/*,
        sync: [
          {
            src: 'dist/*',
            dest: '<%= pkg.version %>/'
          }
        ]*/
      },
      staging: {
        upload: [
          {
            src: 'dist/*',
            dest: 'staging/',
            options: {
              headers: {
                "Cache-Control": "max-age=1000, public",
                "Expires": new Date(Date.now() + 1000).toUTCString()
              }
            }
          }
        ]
      }
    }

  });

  grunt.registerTask('build', ['concat', 'uglify']);
  grunt.registerTask('dev', ['build', 'connect', 'watch']);
  grunt.registerTask('test', ['build', 'connect', 'saucelabs-mocha']);
  grunt.registerTask('default', ['build']);
};
