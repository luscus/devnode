'use strict';

var locator  = require(__dirname + '/locator');
var watcher  = require(__dirname + '/../watch');
var message  = require('../spawn/message');
var Module   = require('module');

// these variables are needed inside eval _compile

var internalModule   = require(__dirname + '/internal/module');
var vm               = require('vm');
var runInNewContext  = vm.runInNewContext;
var runInThisContext = vm.runInThisContext;
var shebangRe        = /^\#\!.*/;
var path             = require('path');

var _require         = Module.prototype.require;
var _compile         = Module.prototype._compile;

// fix for Node.js version >= 5.5.0
function stat(filename) {
    filename = path._makeLong(filename);
    const cache = stat.cache;
    if (cache !== null) {
        const result = cache.get(filename);
        if (result !== undefined) return result;
    }
    const result = internalModuleStat(filename);
    if (cache !== null) cache.set(filename, result);
    return result;
}
stat.cache = null;

/**
 * A wrapper for the native Node.js require method.
 * Depending on the devnode.isActive status, it will
 * load dependencies from different locations:
 * - isActive (true): the method will try to load the
 *   dependency from the project parent directory, if
 *   it fails a second try is made from node_modules
 * - isActive (false): the dependency will be loaded
 * as usual from the node_module directory
 *
 * This wrapper has been inspired by Gleb Bahmutov excellent
 * article [Hacking Node require]{@link http://bahmutov.calepin.co/hacking-node-require.html}
 * and the resulting package [really-need]{@link https://github.com/bahmutov/really-need}
 *
 * @param {string} requirePath a path or dependency name
 * @returns {*} the requested dependency loaded either
 * from the parent or the node_modules directory
 */
Module.prototype.require = function requireWrapper(packageName) {
    var absolutePath = locator.absolute(packageName, Module._resolveFilename(packageName, this));
    var requiredPackage;

    //console.log(process.pid, 'requireWrapper', packageName, '=>', absolutePath);
    try {
        // try to require the generated absolute path
        requiredPackage  = _require(absolutePath);
    }
    catch (error) {
        var validMassage = 'Cannot find module \'' + absolutePath + '\'';

        if (error.code === 'MODULE_NOT_FOUND' && validMassage === error.message) {
            // generated path could not be loaded,
            // try again from the node_modules directory
            absolutePath    = Module._resolveFilename(packageName, this);
            requiredPackage = Module._load(absolutePath);
        }
        else {

            // loading file failed because of an internal error
            // none the less, it may be a watchable file
            // if it is the case devnode will reload on fix
            watcher.checkCandidate(absolutePath);

            // some other error occurred while loading the file,
            // throw it to avoid breaking the chain
            return process.send(message.requireError(process.env.DEVNODE_SCRIPT, error.stack), function () {
                // terminate child process
                process.exit(1);
            });
        }
    }

    watcher.checkCandidate(absolutePath);

    // return the loaded package
    return requiredPackage;
};

// see Module.prototype._compile in
// https://github.com/joyent/node/blob/master/lib/module.js
var _compileStr = _compile.toString();

/*jshint evil:true */
var patchedCompile = eval('(' + _compileStr + ')');

Module.prototype._compile = function compileWrapper (content, filename) {
    return patchedCompile.call(this, content, filename);
};

module.exports = Module;
