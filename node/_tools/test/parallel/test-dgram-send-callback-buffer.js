// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 18.8.0
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';

const common = require('../common');
const assert = require('assert');
const dgram = require('dgram');

const client = dgram.createSocket('udp4');

const buf = Buffer.allocUnsafe(256);

const onMessage = common.mustSucceed((bytes) => {
  assert.strictEqual(bytes, buf.length);
  client.close();
});

client.bind(0, () => client.send(buf,
                                 client.address().port,
                                 common.localhostIPv4,
                                 onMessage));
