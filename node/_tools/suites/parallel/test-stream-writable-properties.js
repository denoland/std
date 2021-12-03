// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 16.13.1
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
require('../common');
const assert = require('assert');

const { Writable } = require('stream');

{
  const w = new Writable();
  assert.strictEqual(w.writableCorked, 0);
  w.uncork();
  assert.strictEqual(w.writableCorked, 0);
  w.cork();
  assert.strictEqual(w.writableCorked, 1);
  w.cork();
  assert.strictEqual(w.writableCorked, 2);
  w.uncork();
  assert.strictEqual(w.writableCorked, 1);
  w.uncork();
  assert.strictEqual(w.writableCorked, 0);
  w.uncork();
  assert.strictEqual(w.writableCorked, 0);
}
