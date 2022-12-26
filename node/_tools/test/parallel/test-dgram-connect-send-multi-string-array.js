// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 18.12.1
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
const common = require('../common');
const assert = require('assert');
const dgram = require('dgram');
const socket = dgram.createSocket('udp4');
const data = ['foo', 'bar', 'baz'];

socket.on('message', common.mustCall((msg, rinfo) => {
  socket.close();
  assert.deepStrictEqual(msg.toString(), data.join(''));
}));

socket.bind(0, () => {
  socket.connect(socket.address().port, common.mustCall(() => {
    socket.send(data);
  }));
});
