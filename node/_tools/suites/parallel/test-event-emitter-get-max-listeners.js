// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 16.13.1
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
require('../common');
const assert = require('assert');
const EventEmitter = require('events');

const emitter = new EventEmitter();

assert.strictEqual(emitter.getMaxListeners(), EventEmitter.defaultMaxListeners);

emitter.setMaxListeners(0);
assert.strictEqual(emitter.getMaxListeners(), 0);

emitter.setMaxListeners(3);
assert.strictEqual(emitter.getMaxListeners(), 3);

// https://github.com/nodejs/node/issues/523 - second call should not throw.
const recv = {};
EventEmitter.prototype.on.call(recv, 'event', () => {});
EventEmitter.prototype.on.call(recv, 'event', () => {});
