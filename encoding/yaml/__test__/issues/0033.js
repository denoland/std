// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('refactor compact variant of MarkedYAMLError.toString', function () {
  var source = readFileSync(require('path').join(__dirname, '/0033.yml'), 'utf8');

  assert.throws(function () {
    yaml.safeLoad(source);
  }, "require('issue-33.yml') should throw, but it does not");
});
