'use strict';

var context  = require('../context.json');
var locator  = require('../require/locator');
var path     = require('path');

exports.isCandidate = function isCandidate (requirePath) {

    if (requirePath.match(locator.IS_SUB_PACKAGE)) {
        // path part of some dependency
        return false;
    }

    if (requirePath.match(locator.IS_DIRECTORY)) {
        // is a package directory in the workplace
        return false;
    }

    if (requirePath.match(locator.IS_CORE_MODULE)) {
        // is a core module
        return false;
    }

    if (context.watched[requirePath]) {
        // already watched
        return false;
    }

    return true;
};
