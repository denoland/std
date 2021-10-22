// deno-fmt-ignore-file
// deno-lint-ignore-file

// Copyright Joyent and Node contributors. All rights reserved. MIT license.
// Taken from Node 16.12.0
// This file is automatically generated by "node/_tools/setup.ts". Do not modify this file manually

'use strict';
// Flags: --expose-gc

// Note: This is a variant of test-net-write-fully-async-hex-string.js.
// This always worked, but it seemed appropriate to add a test that checks the
// behavior for Buffers, too.
const common = require('../common');
const net = require('net');

const data = Buffer.alloc(1000000);

const server = net.createServer(common.mustCall(function(conn) {
  conn.resume();
})).listen(0, common.mustCall(function() {
  const conn = net.createConnection(this.address().port, common.mustCall(() => {
    let count = 0;

    function writeLoop() {
      if (count++ === 200) {
        conn.destroy();
        server.close();
        return;
      }

      while (conn.write(Buffer.from(data)));
      global.gc(true);
      // The buffer allocated above should still be alive.
    }

    conn.on('drain', writeLoop);

    writeLoop();
  }));
}));
