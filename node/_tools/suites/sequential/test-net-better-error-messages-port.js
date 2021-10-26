// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 16.12.0
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
const common = require('../common');
const net = require('net');
const assert = require('assert');

const c = net.createConnection(common.PORT);

c.on('connect', common.mustNotCall());

c.on('error', common.mustCall(function(e) {
  assert.strictEqual(e.code, 'ECONNREFUSED');
  assert.strictEqual(e.port, common.PORT);
  assert.strictEqual(e.address, '127.0.0.1');
}));
