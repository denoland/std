// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');


function testHandler(actual) {
  var expected = testHandler.expected;

  assert.strictEqual(actual.length, expected.length);

  assert.strictEqual(actual.length, expected.length);

  assert.strictEqual(
    actual[0](),
    expected[0]());

  assert.strictEqual(
    actual[1](10, 20),
    expected[1](10, 20));

  assert.deepEqual(
    actual[2]('book'),
    expected[2]('book'));
}

testHandler.expected = [
  function () {
    return 42;
  },
  function () {
    return 72;
  },
  function () {
    return 23;
  },
  function (x, y) {
    return x + y;
  },
  function (foo) {
    var result = 'There is my ' + foo + ' at the table.';

    return {
      first: 42,
      second: 'sum',
      third: result
    };
  }
];


module.exports = testHandler;
