// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');


test.skip('Block scalar chomping does not work on zero indent', function () {
  assert.throws(function () { yaml.load('|-\nfoo\nbar'); }, yaml.YAMLException);
  assert.deepEqual(yaml.dump('foo\nbar'), '|-\n  foo\nbar');
});
