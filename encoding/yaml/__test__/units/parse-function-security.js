// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var fs     = require('fs');
var path   = require('path');
var yaml   = require('../../lib/js-yaml');


var badThings = [];


global.makeBadThing = function (thing) {
  badThings.push(thing);
};


test('Function constructor must not allow to execute any code while parsing.', function () {
  var filename = path.join(__dirname, 'parse-function-security.yml'),
      contents = fs.readFileSync(filename, 'utf8');

  assert.throws(function () { yaml.load(contents); }, yaml.YAMLException);
  assert.deepEqual(badThings, []);
});
