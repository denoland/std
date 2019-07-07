// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');

var expected = [
  0.0,
  1.0,
  -1.0,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  NaN,
  NaN
];

function testHandler(actual) {
  assert.strictEqual(Object.prototype.toString.call(actual), '[object Array]');
  assert.strictEqual(actual.length, 7);
  assert.strictEqual(actual[0], expected[0]);
  assert.strictEqual(actual[1], expected[1]);
  assert.strictEqual(actual[2], expected[2]);
  assert.strictEqual(actual[3], expected[3]);
  assert.strictEqual(actual[4], expected[4]);
  assert(Number.isNaN(actual[5]));
  assert(Number.isNaN(actual[6]));
}

testHandler.expected = expected;

module.exports = testHandler;
