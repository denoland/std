// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');


test('should indent arrays an extra level by default', function () {
  var output = yaml.safeDump({ array: [ 'a', 'b' ] });
  var expected = 'array:\n  - a\n  - b\n';
  assert.strictEqual(output, expected);
});

test('should not indent arrays an extra level when disabled', function () {
  var output = yaml.safeDump({ array: [ 'a', 'b' ] }, { noArrayIndent: true });
  var expected = 'array:\n- a\n- b\n';
  assert.strictEqual(output, expected);
});
