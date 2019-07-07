// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');
var readFileSync = require('fs').readFileSync;


test('Non-specific "!" tags should resolve to !!str', function () {
  var data = yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0017.yml'), 'utf8'));

  assert.strictEqual(typeof data, 'string');
});
