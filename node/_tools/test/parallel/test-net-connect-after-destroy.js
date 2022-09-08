// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 18.8.0
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
// Regression test for https://github.com/nodejs/node-v0.x-archive/issues/819.

require('../common');
const net = require('net');

// Connect to something that we need to DNS resolve
const c = net.createConnection(80, 'google.com');
c.destroy();
