// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 16.13.1
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';

require('../common');

const assert = require('assert');
const stream = require('stream');

// Verify that all individual aliases are left in place.

assert.strictEqual(stream.Readable, require('_stream_readable'));
assert.strictEqual(stream.Writable, require('_stream_writable'));
assert.strictEqual(stream.Duplex, require('_stream_duplex'));
assert.strictEqual(stream.Transform, require('_stream_transform'));
assert.strictEqual(stream.PassThrough, require('_stream_passthrough'));
