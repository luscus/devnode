'use strict';

var spawner = require('./spawn/spawner');
var cli     = require('./cli/index');


module.exports = function devnode (options) {
  process.env.DEVNODE_ACTIVE = true;
  process.env.DEVNODE_ROOT   = options.root;

  options.scripts.forEach(function (script) {
    spawner.spawn(script, options);
  });
};
