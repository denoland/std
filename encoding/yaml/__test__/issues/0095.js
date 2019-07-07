// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');


test('Empty block scalars loaded wrong', function () {
  assert.deepEqual(yaml.load('a: |\nb: .'),  { a: '', b: '.' });
  assert.deepEqual(yaml.load('a: |+\nb: .'), { a: '', b: '.' });
  assert.deepEqual(yaml.load('a: |-\nb: .'), { a: '', b: '.' });

  assert.deepEqual(yaml.load('a: >\nb: .'),  { a: '', b: '.' });
  assert.deepEqual(yaml.load('a: >+\nb: .'), { a: '', b: '.' });
  assert.deepEqual(yaml.load('a: >-\nb: .'), { a: '', b: '.' });

  assert.deepEqual(yaml.load('a: |\n\nb: .'),  { a: '',   b: '.' });
  assert.deepEqual(yaml.load('a: |+\n\nb: .'), { a: '\n', b: '.' });
  assert.deepEqual(yaml.load('a: |-\n\nb: .'), { a: '',   b: '.' });

  assert.deepEqual(yaml.load('a: >\n\nb: .'),  { a: '',   b: '.' });
  assert.deepEqual(yaml.load('a: >+\n\nb: .'), { a: '\n', b: '.' });
  assert.deepEqual(yaml.load('a: >-\n\nb: .'), { a: '',   b: '.' });
});
