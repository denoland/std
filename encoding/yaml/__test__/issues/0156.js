// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.

var assert = require('assert');
var yaml   = require('../../lib/js-yaml');


function SuccessSignal() {}

var TestClassYaml = new yaml.Type('!test', {
  kind: 'scalar',
  resolve: function () { throw new SuccessSignal(); }
});

var TEST_SCHEMA = yaml.Schema.create([ TestClassYaml ]);


test('Resolving of empty nodes are skipped in some cases', function () {
  assert.throws(function () { yaml.load('- foo: !test\n- bar: baz', { schema: TEST_SCHEMA }); }, SuccessSignal);
});
