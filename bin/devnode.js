#!/usr/bin/env node
'use strict';

var program = require('commander');
var cli     = require('../lib/cli');
var pack    = require('../package.json');
var devnode = require('../' + pack.main);

program
  .version(pack.version)
  .description('Starts one or more Node.js applications')
  .usage('<path> [otherPaths...]')
  .action(function () {
    var options = cli.parse(process.argv);
    devnode(options);
  })
  .parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
