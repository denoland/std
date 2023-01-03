// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 18.12.1
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
const common = require('../common');
const { Console } = require('console');
const { Writable } = require('stream');

for (const method of ['dir', 'log', 'warn']) {
  {
    const out = new Writable({
      write: common.mustCall((chunk, enc, callback) => {
        callback(new Error('foobar'));
      })
    });

    const c = new Console(out, out, true);
    c[method]('abc'); // Should not throw.
  }

  {
    const out = new Writable({
      write: common.mustCall((chunk, enc, callback) => {
        throw new Error('foobar');
      })
    });

    const c = new Console(out, out, true);
    c[method]('abc'); // Should not throw.
  }

  {
    const out = new Writable({
      write: common.mustCall((chunk, enc, callback) => {
        setImmediate(() => callback(new Error('foobar')));
      })
    });

    const c = new Console(out, out, true);
    c[method]('abc'); // Should not throw.
  }
}
