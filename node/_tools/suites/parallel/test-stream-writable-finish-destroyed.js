// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 16.13.1
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';

const common = require('../common');
const { Writable } = require('stream');

{
  const w = new Writable({
    write: common.mustCall((chunk, encoding, cb) => {
      w.on('close', common.mustCall(() => {
        cb();
      }));
    })
  });

  w.on('finish', common.mustNotCall());
  w.end('asd');
  w.destroy();
}

{
  const w = new Writable({
    write: common.mustCall((chunk, encoding, cb) => {
      w.on('close', common.mustCall(() => {
        cb();
        w.end();
      }));
    })
  });

  w.on('finish', common.mustNotCall());
  w.write('asd');
  w.destroy();
}
