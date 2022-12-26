// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 18.12.1
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
require('../common');
const { Readable } = require('stream');
const assert = require('assert');

let buf = '';
const euro = Buffer.from([0xE2, 0x82, 0xAC]);
const cent = Buffer.from([0xC2, 0xA2]);
const source = Buffer.concat([euro, cent]);

const readable = Readable({ encoding: 'utf8' });
readable.push(source.slice(0, 2));
readable.push(source.slice(2, 4));
readable.push(source.slice(4, 6));
readable.push(null);

readable.on('data', function(data) {
  buf += data;
});

process.on('exit', function() {
  assert.strictEqual(buf, '€¢');
});
