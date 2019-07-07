// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('Unwanted line breaks in folded scalars', function () {
  var data = yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0093.yml'), 'utf8'));

  assert.strictEqual(data.first,  'a b\n  c\n  d\ne f\n');
  assert.strictEqual(data.second, 'a b\n  c\n\n  d\ne f\n');
  assert.strictEqual(data.third,  'a b\n\n  c\n  d\ne f\n');
});
