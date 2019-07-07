// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');


test('should dump astrals as codepoint', function () {
  assert.deepEqual(yaml.safeDump('😀'), '"\\U0001F600"\n');
  assert.deepEqual(yaml.safeLoad('"\\U0001F600"'), '😀');
});
