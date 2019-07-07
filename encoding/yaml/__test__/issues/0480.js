// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');
var readFileSync = require('fs').readFileSync;


test('Should not execute code when object with toString property is used as a key', function () {
  var data = yaml.load(readFileSync(require('path').join(__dirname, '/0480-fn.yml'), 'utf8'));

  assert.deepEqual(data, { '[object Object]': 'key' });
});

test('Should not execute code when object with __proto__ property is used as a key', function () {
  var data = yaml.load(readFileSync(require('path').join(__dirname, '/0480-fn2.yml'), 'utf8'));

  assert.deepEqual(data, { '[object Object]': 'key' });
});

test('Should not execute code when object inside array is used as a key', function () {
  var data = yaml.load(readFileSync(require('path').join(__dirname, '/0480-fn-array.yml'), 'utf8'));

  assert.deepEqual(data, { '123,[object Object]': 'key' });
});

// this test does not guarantee in any way proper handling of date objects,
// it just keeps old behavior whenever possible
test('Should leave non-plain objects as is', function () {
  var data = yaml.load(readFileSync(require('path').join(__dirname, '/0480-date.yml'), 'utf8'));

  assert.deepEqual(Object.keys(data).length, 1);
  assert(/2019/.test(Object.keys(data)[0]));
});
