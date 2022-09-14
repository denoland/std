// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 18.8.0
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
const common = require('../common');
const stream = require('stream');

const r = new stream.Stream();
r.listenerCount = undefined;

const w = new stream.Stream();
w.listenerCount = undefined;

w.on('pipe', function() {
  r.emit('error', new Error('Readable Error'));
  w.emit('error', new Error('Writable Error'));
});
r.on('error', common.mustCall());
w.on('error', common.mustCall());
r.pipe(w);
