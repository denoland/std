// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');


test('Indentation warning on empty lines within quoted scalars and flow collections', function () {
  assert.doesNotThrow(function () { yaml.load("- 'hello\n\n  world'"); });
  assert.doesNotThrow(function () { yaml.load('- "hello\n\n  world"'); });
  assert.doesNotThrow(function () { yaml.load('- [hello,\n\n  world]'); });
  assert.doesNotThrow(function () { yaml.load('- {hello: world,\n\n  foo: bar}'); });
});
