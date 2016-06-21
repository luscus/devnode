'use strict';

exports.sep             = '::';
exports.REQUIRE_ERROR   = 'DEVNODE_REQUIRE_ERROR';
exports.REGISTER_MODULE = 'DEVNODE_WATCHER_REGISTER';
exports.MODULE_CHANGE   = 'DEVNODE_WATCHER_CHANGE';

function format () {
  var messageParts = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
  return messageParts.join(exports.sep);
}

exports.requireError = function requireError (script, stack) {
  return format(exports.REQUIRE_ERROR, script, stack);
};

exports.registerModule = function registerModule (script, module) {
  return format(exports.REGISTER_MODULE, script, module);
};

exports.moduleChange = function moduleChange (module) {
  return format(exports.MODULE_CHANGE, module);
};
