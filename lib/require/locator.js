'use strict';

var context  = require('../context.json');
var path     = require('path');
var fs       = require('fs');

exports.escapeSeparator = function escapeSeparator (rawPath) {
  return rawPath.replace('\\', '\\\\').replace('/', '\/');
};

/**
 * Path prefix appended to the dependency name
 *
 * @type {string}
 */
exports.DEPENDENCY_PATH_PREFIX = path.sep + '..' + path.sep;
exports.IS_ROOT_PACKAGE = new RegExp('^(' + process.cwd().replace('\\', '\\\\').replace('/', '\/') + ')');
exports.WORKPLACE_PATH  = path.normalize(process.cwd() + path.sep + '..');
exports.IS_SUB_PACKAGE  = new RegExp(
    '^(' +
    exports.escapeSeparator(exports.WORKPLACE_PATH) +
    exports.escapeSeparator(path.sep) +
    '[\.0-9a-zA-Z_-]+' +
    exports.escapeSeparator(path.sep) +
    'node_modules)'
);
exports.IS_IN_DIRECTORY = new RegExp(
    '^(' +
    exports.escapeSeparator(exports.WORKPLACE_PATH) +
    exports.escapeSeparator(path.sep) +
    '[\.0-9a-zA-Z_-]+)'
);
exports.DEPENDENCY_PATH = new RegExp(
    '^(' +
    exports.escapeSeparator(exports.WORKPLACE_PATH) +
    exports.escapeSeparator(path.sep) +
    '[\.0-9a-zA-Z_-]+' +
    exports.escapeSeparator(path.sep) +
    'node_modules' +
    exports.escapeSeparator(path.sep) +
    '[\.0-9a-zA-Z_-]+)'
);

exports.IS_DIRECTORY    = new RegExp(
    '^(' +
    exports.escapeSeparator(exports.WORKPLACE_PATH) +
    exports.escapeSeparator(path.sep) +
    '[\.0-9a-zA-Z_-]+)$'
);
exports.IS_CORE_MODULE  = /^(?!(\/|\\))[a-zA-Z_]+$/;
exports.IS_PACKAGE_NAME = /^(?!(\/|\\))[\.a-zA-Z-_]+$/;
exports.IS_LOCAL_IMPORT = /^(?!(\/|\\))\.{1,2}(\/|\\).*/;
exports.IS_ABSOLUTE_PATH = /^(\/|\\).*/;

context.root            = process.cwd();
context.rootModule      = context.root + path.sep + 'node_modules';
context.workplace       = path.normalize(context.root + path.sep + '..');
context.edited          = {};
context.edited.checked  = {};
context.edited.loaded   = {};
context.edited.found    = [];

exports.WORKPLACE_PATH  = context.workplace;
exports.IS_ROOT_PACKAGE = new RegExp('^(' + context.root.replace('\\', '\\\\').replace('/', '\/') + ')');

/**
 * Depending on the devnode.isActive status,
 * transforms a dependency name into an absolute path
 * to this dependency in the package parent directory.
 * Relative paths will be ignored and returned unchanged.
 *
 * @param {string} requirePath a path or dependency name
 * @returns {string} either an relative path to some packge
 * internal resource or an absolute path to a dependency
 */
exports.absolute = function absolute (requirePath, resolvedPath) {
  requirePath    = path.normalize(requirePath);
  var moduleName = exports.getModuleName(resolvedPath) || requirePath;


  if (requirePath === resolvedPath) {
    // required is a core module
    return resolvedPath;
  } else if (exports.IS_PACKAGE_NAME.test(requirePath) && !exports.IS_CORE_MODULE.test(resolvedPath)) {
    var moduleDevDirPath = exports.devDirPath(requirePath);

    if (moduleDevDirPath) {
      exports.register(moduleName, resolvedPath, moduleDevDirPath);
    }
  }

  return exports.rebase(moduleName, resolvedPath, context);
};

exports.rebase = function rebase(moduleName, resolvedPath, context) {
    var searchedString = null;

  if (context.edited.loaded[moduleName]) {
    // module directory exists in workplace
    searchedString          = 'node_modules' + path.sep + moduleName;
    var searchedStringIndex = resolvedPath.indexOf(searchedString);
    var validPathStartIndex = 0;
    var validPathSection    = '';

    if (validPathStartIndex) {
      validPathStartIndex   = searchedStringIndex + searchedString.length;
      validPathSection      = resolvedPath.substring(validPathStartIndex);
    }

    var rebasedPath         = context.edited.loaded[moduleName].root + validPathSection;

    return rebasedPath;
  }

  // moduleName is not part of the watched workspace modules
  // but it may be part of one of those: check absolute path for watched modules
  var index = context.edited.found.length;

  while (index--) {
    var parentModuleName = context.edited.found[index];
    searchedString       = 'node_modules' + path.sep + parentModuleName;

    if (resolvedPath.indexOf(searchedString) > 0) {
        // module is a dependency of a watched module: rebase it
      return exports.rebase(context.edited.found[index], resolvedPath, context);
    }
  }

    // module is nether watched nor a dependency of a watched module
  return resolvedPath;
};

exports.devDirPath = function devDirPath(requirePath) {
  var relativePath = exports.DEPENDENCY_PATH_PREFIX + requirePath;
  var rebasedPath  = path.normalize(context.root + relativePath);

  if (context.edited.checked[rebasedPath]) {
    return context.edited.checked[rebasedPath];
  }

  try {
    var stats = fs.statSync(rebasedPath);

    if (stats.isDirectory()) {
      context.edited.checked[rebasedPath] = rebasedPath;
    }
  }
  catch (error) {
    if (error.code !== 'ENOENT') {
      // some other error occurred,
      // throw it to avoid breaking the chain
      throw error;
    }

    context.edited.checked[rebasedPath] = null;
  }

  return context.edited.checked[rebasedPath];
};

exports.getModuleName = function getModuleName(resolvedPath) {
  var moduleDirString    = 'node_modules/';
  var lastModuleDirIndex = resolvedPath.lastIndexOf(moduleDirString);
  var lastSeparatorIndex = resolvedPath.indexOf(path.sep, lastModuleDirIndex + moduleDirString.length);
  var key                = resolvedPath.substring(lastModuleDirIndex + moduleDirString.length, lastSeparatorIndex);

  if (lastModuleDirIndex < 0) {
    key = null;
  }

  return key;
};

exports.register = function register (moduleName, resolvedPath, rebasedPath) {
  if (!context.edited.loaded[moduleName]) {
    context.edited.loaded[moduleName] = {
      name: moduleName,
      root: rebasedPath
    };

    context.edited.found.push(moduleName);
  }

  return context.edited.loaded[moduleName];
};

