// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');


test('should properly dump negative ints in different styles', function () {
  var dump, src = { integer: -100 };

  dump = yaml.dump(src, { styles: { '!!int': 'binary' } });
  assert.deepEqual(yaml.safeLoad(dump), src);

  dump = yaml.dump(src, { styles: { '!!int': 'octal' } });
  assert.deepEqual(yaml.safeLoad(dump), src);

  dump = yaml.dump(src, { styles: { '!!int': 'hex' } });
  assert.deepEqual(yaml.safeLoad(dump), src);
});
