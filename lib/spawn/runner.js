'use strict';

var Crawler  = require('fs-crawler');
var crawler  = new Crawler();
var path     = require('path');
var fs       = require('fs');
var Module   = require('module');
var _require = Module.prototype.require;
var location = process.argv[2];

if (location) {

  var stats     = fs.lstatSync(location);
  var scriptDir = location;

  //console.log('stats.isDirectory()', stats.isDirectory());
  if (!stats.isDirectory()) {
    scriptDir = path.dirname(location);
  }

  // find script root - first directory containing a "package.json" file
  var packages = crawler.crawlPathSync(scriptDir, {
    noStats: true,
    filters: [ /.+package\.json$/]
  });

  var scriptRoot = path.dirname(packages[0].path);

  process.chdir(scriptRoot);
  process.env.DEVNODE_SCRIPT = location;

// load the module locator
  require(process.env.DEVNODE_ROOT + '/lib/require/locator');

// load native require patch
  require(process.env.DEVNODE_ROOT + '/lib/require/patch');

  try {
    require(location);
  }
  catch (error) {
    console.error(error.stack);
  }
}
