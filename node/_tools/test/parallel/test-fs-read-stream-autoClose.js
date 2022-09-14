// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 18.8.0
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';

const common = require('../common');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const tmpdir = require('../common/tmpdir');
const writeFile = path.join(tmpdir.path, 'write-autoClose.txt');
tmpdir.refresh();

const file = fs.createWriteStream(writeFile, { autoClose: true });

file.on('finish', common.mustCall(() => {
  assert.strictEqual(file.destroyed, false);
}));
file.end('asd');
