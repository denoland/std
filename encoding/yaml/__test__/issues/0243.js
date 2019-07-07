// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../');
var readFileSync = require('fs').readFileSync;


test('Duplicated mapping key errors on top level throw at beginning of key', function () {
  var src = readFileSync(require('path').join(__dirname, '/0243-basic.yml'), 'utf8');
  var lines = src.split('\n');

  try {
    yaml.safeLoad(src);
  } catch (e) {
    assert.equal(lines[e.mark.line], 'duplicate: # 2');
  }
});

test('Duplicated mapping key errors inside of mapping values throw at beginning of key', function () {
  var src = readFileSync(require('path').join(__dirname, '/0243-nested.yml'), 'utf8');
  var lines = src.split('\n');

  try {
    yaml.safeLoad(src);
  } catch (e) {
    assert.equal(lines[e.mark.line], '  duplicate: # 2');
  }
});
