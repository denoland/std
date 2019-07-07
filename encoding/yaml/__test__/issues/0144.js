// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');


test('Infinite loop when attempting to parse multi-line scalar document that is not indented', function () {
  assert.strictEqual(yaml.load('--- |\nfoo\n'), 'foo\n');
});
