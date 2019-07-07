// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');


test('Invalid parse error on whitespace between quoted scalar keys and ":" symbol in mappings', function () {
  assert.doesNotThrow(function () {
    yaml.load('{ "field1" : "v1", "field2": "v2" }');
  });
});
