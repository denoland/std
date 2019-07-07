// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');


test('Plain scalar "constructor" parsed as `null`', function () {
  assert.strictEqual(yaml.load('constructor'),          'constructor');
  assert.deepEqual(yaml.load('constructor: value'),     { constructor: 'value' });
  assert.deepEqual(yaml.load('key: constructor'),       { key: 'constructor' });
  assert.deepEqual(yaml.load('{ constructor: value }'), { constructor: 'value' });
  assert.deepEqual(yaml.load('{ key: constructor }'),   { key: 'constructor' });
});
