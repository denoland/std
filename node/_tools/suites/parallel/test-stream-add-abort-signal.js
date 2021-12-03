// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 16.13.1
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

// Flags: --expose-internals
'use strict';

require('../common');
const assert = require('assert');
const { addAbortSignal, Readable } = require('stream');
const {
  addAbortSignalNoValidate,
} = require('internal/streams/add-abort-signal');

{
  assert.throws(() => {
    addAbortSignal('INVALID_SIGNAL');
  }, /ERR_INVALID_ARG_TYPE/);

  const ac = new AbortController();
  assert.throws(() => {
    addAbortSignal(ac.signal, 'INVALID_STREAM');
  }, /ERR_INVALID_ARG_TYPE/);
}

{
  const r = new Readable({
    read: () => {},
  });
  assert.deepStrictEqual(r, addAbortSignalNoValidate('INVALID_SIGNAL', r));
}
