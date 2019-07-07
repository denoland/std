// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../..');

test('should not indent arrays an extra level when disabled', function () {
  /* eslint-disable max-len */
  var output = yaml.dump(
    [
      {
        a: 'a_val',
        b: 'b_val'
      },
      {
        a: 'a2_val',
        items: [
          {
            a: 'a_a_val',
            b: 'a_b_val'
          }
        ]
      }
    ],
    { noArrayIndent: true }
  );
  var expected = '- a: a_val\n  b: b_val\n- a: a2_val\n  items:\n  - a: a_a_val\n    b: a_b_val\n';
  assert.strictEqual(output, expected);
});
