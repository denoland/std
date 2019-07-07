// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../..');
var readFileSync = require('fs').readFileSync;


test('should include the error message in the error stack', function () {
  try {
    yaml.safeLoad(readFileSync(require('path').join(__dirname, '/0351.yml'), 'utf8'));
  } catch (err) {
    assert(err.stack.startsWith('YAMLException: end of the stream or a document separator is expected'));
    return;
  }
  assert.fail(null, null, 'Expected an error to be thrown');
});
