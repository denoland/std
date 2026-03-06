// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { readAll, readAllSync } from "./read_all.ts";
import { Buffer } from "./buffer.ts";
import { init } from "./_test_common.ts";
import type { Reader, ReaderSync } from "./types.ts";

Deno.test("readAll()", async () => {
  const testBytes = init();
  assert(testBytes);
  const reader = new Buffer(testBytes.buffer);
  const actualBytes = await readAll(reader);
  assertEquals(testBytes, actualBytes);
});

Deno.test("readAllSync()", () => {
  const testBytes = init();
  assert(testBytes);
  const reader = new Buffer(testBytes.buffer);
  const actualBytes = readAllSync(reader);
  assertEquals(testBytes, actualBytes);
});

Deno.test("readAll() and readAllSync() can read slow buffer correctly", async () => {
  class SlowBuffer implements Reader, ReaderSync {
    #remaining: Uint8Array;

    constructor(bytes: Uint8Array) {
      this.#remaining = bytes;
    }

    // deno-lint-ignore require-await -- implementing `Reader` interface
    async read(p: Uint8Array): Promise<number | null> {
      return this.readSync(p);
    }

    readSync(p: Uint8Array): number | null {
      if (p.length === 0) {
        throw new TypeError("p is empty");
      }
      const remaining = this.#remaining;
      if (remaining.length === 0) {
        // no more bytes to read; signal end-of-stream
        return null;
      }
      // read one byte at a time
      p.set(remaining.subarray(0, 1));
      this.#remaining = remaining.subarray(1);
      return 1;
    }
  }

  {
    const testBytes = crypto.getRandomValues(new Uint8Array(20));
    const reader = new SlowBuffer(testBytes);
    const actualBytes = await readAll(reader);
    assertEquals(actualBytes, testBytes);
  }
  {
    const testBytes = crypto.getRandomValues(new Uint8Array(20));
    const reader = new SlowBuffer(testBytes);
    const actualBytes = readAllSync(reader);
    assertEquals(actualBytes, testBytes);
  }
});
