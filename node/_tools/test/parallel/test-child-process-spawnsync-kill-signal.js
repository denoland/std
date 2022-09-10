// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 16.13.0
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

// Flags: --expose-internals
'use strict';
const common = require('../common');
const assert = require('assert');
const cp = require('child_process');

if (Deno.args[2] === 'child') {
  setInterval(() => {}, 1000);
} else {
  const internalCp = require('internal/child_process');
  const oldSpawnSync = internalCp.spawnSync;
  const { SIGKILL } = require('os').constants.signals;

  function spawn(killSignal, beforeSpawn) {
    if (beforeSpawn) {
      internalCp.spawnSync = common.mustCall(function(opts) {
        beforeSpawn(opts);
        return oldSpawnSync(opts);
      });
    }
    const child = cp.spawnSync(Deno.execPath(),
                               [__filename, 'child'],
                               { killSignal, timeout: 100 });
    if (beforeSpawn)
      internalCp.spawnSync = oldSpawnSync;
    assert.strictEqual(child.status, null);
    assert.strictEqual(child.error.code, 'ETIMEDOUT');
    return child;
  }

  // Verify that an error is thrown for unknown signals.
  assert.throws(() => {
    spawn('SIG_NOT_A_REAL_SIGNAL');
  }, { code: 'ERR_UNKNOWN_SIGNAL', name: 'TypeError' });

  // Verify that the default kill signal is SIGTERM.
  {
    const child = spawn(undefined, (opts) => {
      assert.strictEqual(opts.killSignal, undefined);
    });

    assert.strictEqual(child.signal, 'SIGTERM');
  }

  // Verify that a string signal name is handled properly.
  {
    const child = spawn('SIGKILL', (opts) => {
      assert.strictEqual(opts.killSignal, SIGKILL);
    });

    assert.strictEqual(child.signal, 'SIGKILL');
  }

  // Verify that a numeric signal is handled properly.
  {
    assert.strictEqual(typeof SIGKILL, 'number');

    const child = spawn(SIGKILL, (opts) => {
      assert.strictEqual(opts.killSignal, SIGKILL);
    });

    assert.strictEqual(child.signal, 'SIGKILL');
  }
}
