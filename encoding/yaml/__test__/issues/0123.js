// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');


test('RegExps should be properly closed', function () {
  assert.throws(function () { yaml.load('!!js/regexp /fo'); });
  assert.throws(function () { yaml.load('!!js/regexp /fo/q'); });
  assert.throws(function () { yaml.load('!!js/regexp /fo/giii'); });

  // https://github.com/nodeca/js-yaml/issues/172
  var regexp = yaml.load('!!js/regexp /fo/g/g');
  assert.ok(regexp instanceof RegExp);
  var regexpStr = regexp.toString();
  // Accept the old (slightly incorrect) V8, as well as the new V8 result
  // TODO: Remove when/if Node 0.12 and below is no longer supported.
  if (regexpStr === '/fo/g/g') {
    assert.strictEqual(regexpStr, '/fo/g/g');
  } else {
    assert.strictEqual(regexpStr, '/fo\\/g/g');
  }
});
