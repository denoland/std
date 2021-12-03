// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 16.13.1
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';

const common = require('../common');
const { Readable } = require('stream');

{
  const r = new Readable({ read() {} });

  r.on('end', common.mustNotCall());
  r.on('data', common.mustCall());
  r.on('error', common.mustCall());
  r.push('asd');
  r.push(null);
  r.destroy(new Error('kaboom'));
}
