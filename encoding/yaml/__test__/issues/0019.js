// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('Timestamp parsing is one month off', function () {
  var data = yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0019.yml'), 'utf8'));

  // JS month starts with 0 (0 => Jan, 1 => Feb, ...)
  assert.strictEqual(data.xmas.getTime(), Date.UTC(2011, 11, 24));
});
