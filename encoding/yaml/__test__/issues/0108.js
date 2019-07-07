// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');


test('Literal scalars have an unwanted leading line break', function () {
  assert.strictEqual(yaml.load('|\n  foobar\n'),            'foobar\n');
  assert.strictEqual(yaml.load('|\n  hello\n  world\n'),      'hello\nworld\n');
  assert.strictEqual(yaml.load('|\n  war never changes\n'), 'war never changes\n');
});
