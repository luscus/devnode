'use strict';

require('termcolor').define();
var LOGGER_PREFIX = '[devnode] ';

exports.logger = {
  log: function log () {
    var messageParts = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
    messageParts.unshift(LOGGER_PREFIX);

    console.green.apply(this, messageParts);
  },
  error: function error () {
    var messageParts = (arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments));
    console.ered.apply(this, messageParts);
  }
};