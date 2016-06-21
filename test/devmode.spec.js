'use strict';

require('chai').should();
var expect = require('chai').expect;

var assert  = require('assert');
var devnode = require('../lib/devnode');
var pathLib = require('path');
var root    = require('package.root');

// get the package's parent directory
var PARENT  = root.path.substring(0,root.path.lastIndexOf(pathLib.sep)) + pathLib.sep;

// Check that no Status output is shown when devnode is inactive
// this is imperative to get the 100% coverage
process.env[devnode.STAGE_ENV_VARIABLE_NAME] = 'PROD';
delete require.cache[require.resolve('../lib/devnode')];
devnode = require('../lib/devnode');

// start tests
describe('devnode', function () {
});
