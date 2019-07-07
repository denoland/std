// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');


test('Loading multidocument source using `load` should cause an error', function () {
  assert.throws(function () {
    yaml.load('--- # first document\n--- # second document\n');
  }, yaml.YAMLException);

  assert.throws(function () {
    yaml.load('---\nfoo: bar\n---\nfoo: bar\n');
  }, yaml.YAMLException);

  assert.throws(function () {
    yaml.load('foo: bar\n---\nfoo: bar\n');
  }, yaml.YAMLException);
});
