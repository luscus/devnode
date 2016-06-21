'use strict';

exports.brocken = function brocken () {
  throw new Error('I am brocken');
};

exports.brocken();
