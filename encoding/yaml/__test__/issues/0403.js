// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');


test('should properly dump leading newlines and spaces', function () {
  var dump, src;

  src = { str: '\n  a\nb' };
  dump = yaml.dump(src);
  assert.deepEqual(yaml.safeLoad(dump), src);

  src = { str: '\n\n  a\nb' };
  dump = yaml.dump(src);
  assert.deepEqual(yaml.safeLoad(dump), src);

  src = { str: '\n  a\nb' };
  dump = yaml.dump(src, { indent: 10 });
  assert.deepEqual(yaml.safeLoad(dump), src);
});
