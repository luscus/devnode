'use strict';

var context  = require('../context.json');
var message  = require('../spawn/message');
var filter   = require('./filter');

context.watched = {};

exports.changeHandler = function changeHandler (requirePath, event) {
    if (event === 'rename' || event === 'change')  {
        // TODO restart the application
        process.send(message.moduleChange(requirePath));
    }

    if (event === 'rename') {
        // file has changed - reset watcher
        process.send(message.registerModule(process.env.DEVNODE_SCRIPT, requirePath));
    }
};

exports.checkCandidate = function checkCandidate (requirePath) {

    if (filter.isCandidate(requirePath)) {
        process.send(message.registerModule(process.env.DEVNODE_SCRIPT, requirePath));
    }
};
