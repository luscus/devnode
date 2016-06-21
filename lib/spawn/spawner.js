'use strict';

var logger       = require('../utils').logger;
var fs           = require('fs');
var message      = require('./message');
var clone        = require('clone');
var childProcess = require('child_process');
var _spawn       = childProcess.spawn;

var childs       = {};
var watches      = {};
var watcher      = {};


exports.spawn = function spawn (scriptPath, options) {
  options = options || {};

  console.green('------------------------------------');
  logger.log('devnode.pid:', process.pid);
  if (options.becauseOf) {
    logger.log('restart:    ', scriptPath);
    logger.log('changed:    ', options.becauseOf);
  } else {
    logger.log('start:      ', scriptPath);
  }

  function mySpawn() {
    var result = _spawn.apply(null, arguments);
    return result;
  }
  childProcess.spawn = mySpawn;

  var env      = clone(process.env);
  env.FILENAME = scriptPath;

  childs[scriptPath] = childs[scriptPath] || {};
  childs[scriptPath].options = options;
  childs[scriptPath].process = childProcess.spawn(
    process.env.SHELL,
    [
      '-c',
      options.node + ' ' + options.root + '/lib/spawn/runner.js ' + scriptPath
    ],
    {
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    }
  );

  var child = childs[scriptPath].process;
  logger.log('child.pid:  ', child.pid, '\n');

  child.on('error', function (error) {
    console.error('CHILD ERROR:', error.stack);
  });

  child.on('message', function (message) {
    exports.processChildMessage(message.toString());
  });

  child.on('exit', function (code) {
    if (code) {
      // TODO on error check if file is watched - if not try to watch (for moves/deletions/renames)
      logger.log('an error occurred, waiting for fix...');
    }
    else {
      logger.log('clean exit, waiting for changes...');
    }
  });

  child.stdout && child.stdout.on('data', function(data) {
    console.log(data.toString().replace(/\n$/, ''));
  });

  child.stderr && child.stderr.on('data', function(data) {
    logger.error(data.toString().replace(/\n$/, ''));
  });
};

exports.processChildMessage = function processChildMessage (event) {
  var parts       = event.split(message.sep);
  var messageType = parts.shift();

  switch (messageType) {
    case message.MODULE_CHANGE:
      var changed  = parts.shift();
      var scripts     = watcher[changed];

      scripts.forEach(function (scriptPath) {
        var options     = childs[scriptPath].options;

        if (!options.restarting) {
          options.restarting = true;

          // add changed script path
          options.becauseOf = changed;

          // kill child process
          childs[scriptPath].process.kill();

          // respawn script
          exports.spawn(scriptPath, options);
          options.restarting = false;
        }
      });
      break;

    case message.REQUIRE_ERROR:
      var scriptPath  = parts.shift();
      var stack       = parts.shift();

      // kill child process
      logger.error(stack);
      break;

    case message.REGISTER_MODULE:
      var script   = parts.shift();
      var required = parts.shift();

      if (!watcher[required]) {
        watcher[required] = [];
      }

      if (watcher[required].indexOf(script) < 0) {
        watcher[required].push(script);
      }

      if (!watches[required]) {
        watches[required] = fs.watch(required, function (event) {
          if (event === 'rename' || event === 'change') {
            exports.processChildMessage(message.moduleChange(required));
          }

          if (event === 'rename') {
            // close previous watcher
            watches[required].close();
            delete watches[required];

            // file has changed - reset watcher
            exports.processChildMessage(message.registerModule(script, required));
          }
        });

        watches[required].on('error', function (error) {
          console.log(script, required, error);
        });
      }
      break;
  }
};
