// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 18.12.0
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
require('../common');

// This test ensures that Node.js doesn't crash on `process.stdin.emit("end")`.
// https://github.com/nodejs/node/issues/1068

process.stdin.emit('end');
