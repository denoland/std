import { assertEquals } from "../assert/assert_equals.ts";
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { iterate, iterateSync } from "./iterate.ts";
import { readerFromIterable } from "../streams/reader_from_iterable.ts";
import { delay } from "../async/delay.ts";
import type { Reader, ReaderSync } from "../io/types.ts";

Deno.test("iterate()", async () => {
  // ref: https://github.com/denoland/deno/issues/2330
  const encoder = new TextEncoder();

  class TestReader implements Reader {
    #offset = 0;
    #buf: Uint8Array;

    constructor(s: string) {
      this.#buf = new Uint8Array(encoder.encode(s));
    }

    read(p: Uint8Array): Promise<number | null> {
      const n = Math.min(p.byteLength, this.#buf.byteLength - this.#offset);
      p.set(this.#buf.slice(this.#offset, this.#offset + n));
      this.#offset += n;

      if (n === 0) {
        return Promise.resolve(null);
      }

      return Promise.resolve(n);
    }
  }

  const reader = new TestReader("hello world!");

  let totalSize = 0;
  await Array.fromAsync(
    iterate(reader),
    (buf) => totalSize += buf.byteLength,
  );

  assertEquals(totalSize, 12);
});

Deno.test("iterate() works with slow consumer", async () => {
  const a = new Uint8Array([97]);
  const b = new Uint8Array([98]);
  const iter = iterate(readerFromIterable([a, b]));
  const promises = [];
  for await (const bytes of iter) {
    promises.push(delay(10).then(() => bytes));
  }
  assertEquals([a, b], await Promise.all(promises));
});

Deno.test("iterateSync()", () => {
  // ref: https://github.com/denoland/deno/issues/2330
  const encoder = new TextEncoder();

  class TestReader implements ReaderSync {
    #offset = 0;
    #buf: Uint8Array;

    constructor(s: string) {
      this.#buf = new Uint8Array(encoder.encode(s));
    }

    readSync(p: Uint8Array): number | null {
      const n = Math.min(p.byteLength, this.#buf.byteLength - this.#offset);
      p.set(this.#buf.slice(this.#offset, this.#offset + n));
      this.#offset += n;

      if (n === 0) {
        return null;
      }

      return n;
    }
  }

  const reader = new TestReader("hello world!");

  let totalSize = 0;
  for (const buf of iterateSync(reader)) {
    totalSize += buf.byteLength;
  }

  assertEquals(totalSize, 12);
});

Deno.test("iterateSync() works with slow consumer", async () => {
  const a = new Uint8Array([97]);
  const b = new Uint8Array([98]);
  const data = [a, b];
  const readerSync = {
    readSync(u8: Uint8Array) {
      const bytes = data.shift();
      if (bytes) {
        u8.set(bytes);
        return bytes.length;
      }
      return null;
    },
  };
  const iter = iterateSync(readerSync);
  const promises = [];
  for (const bytes of iter) {
    promises.push(delay(10).then(() => bytes));
  }
  assertEquals([a, b], await Promise.all(promises));
});
