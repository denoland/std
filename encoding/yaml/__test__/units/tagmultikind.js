// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml = require('../../');

var tags = [ {
  tag: 'Include',
  type: 'scalar'
}, {
  tag: 'Include',
  type: 'mapping'
} ].map(function (fn) {
  return new yaml.Type('!' + fn.tag, {
    kind: fn.type,
    resolve: function () {
      return true;
    },
    construct: function (obj) {
      return obj;
    }
  });
});

var schema = yaml.Schema.create(tags);


test('Process tag with kind: scalar', function () {
  assert.deepEqual(yaml.safeLoad('!Include foobar', {
    schema: schema
  }), 'foobar');
});


test('Process tag with kind: mapping', function () {
  assert.deepEqual(yaml.safeLoad('!Include\n  location: foobar', {
    schema: schema
  }), { location: 'foobar' });
});
