// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');

test('Loader should not strip quotes before newlines', function () {
  var with_space = yaml.load("'''foo'' '");
  var with_newline = yaml.load("'''foo''\n'");
  assert.strictEqual(with_space, "'foo' ");
  assert.strictEqual(with_newline, "'foo' ");
});
