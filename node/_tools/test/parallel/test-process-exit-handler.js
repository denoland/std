// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 18.8.0
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
const common = require('../common');

if (!common.isMainThread)
  common.skip('execArgv does not affect Workers');

// This test ensures that no asynchronous operations are performed in the 'exit'
// handler.
// https://github.com/nodejs/node/issues/12322

process.on('exit', () => {
  setTimeout(() => process.abort(), 0); // Should not run.
  for (const start = Date.now(); Date.now() - start < 10;);
});
