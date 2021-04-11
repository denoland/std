// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// This code has been ported almost directly from Go's src/bytes/buffer_test.go
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
import { assert, assertEquals } from "../testing/asserts.ts";
import { Buffer } from "./buffer.ts";
import {
  iter,
  iterSync,
  readAll,
  readAllSync,
  writeAll,
  writeAllSync,
} from "./util.ts";

// N controls how many iterations of certain checks are performed.
const N = 100;
let testBytes: Uint8Array | null;

export function init(): void {
  if (testBytes == null) {
    testBytes = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      testBytes[i] = "a".charCodeAt(0) + (i % 26);
    }
  }
}

Deno.test("testReadAll", async () => {
  init();
  assert(testBytes);
  const reader = new Buffer(testBytes.buffer as ArrayBuffer);
  const actualBytes = await readAll(reader);
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

Deno.test("testReadAllSync", () => {
  init();
  assert(testBytes);
  const reader = new Buffer(testBytes.buffer as ArrayBuffer);
  const actualBytes = readAllSync(reader);
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

Deno.test("testwriteAll", async () => {
  init();
  assert(testBytes);
  const writer = new Buffer();
  await writeAll(writer, testBytes);
  const actualBytes = writer.bytes();
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

Deno.test("testWriteAllSync", () => {
  init();
  assert(testBytes);
  const writer = new Buffer();
  writeAllSync(writer, testBytes);
  const actualBytes = writer.bytes();
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

function helloWorldFile(): Buffer {
  return new Buffer(new TextEncoder().encode("Hello World!"));
}

Deno.test("filesIter", async () => {
  const file = helloWorldFile();

  let totalSize = 0;
  for await (const buf of iter(file)) {
    totalSize += buf.byteLength;
  }

  assertEquals(totalSize, 12);
});

Deno.test("filesIterCustomBufSize", async () => {
  const file = helloWorldFile();

  let totalSize = 0;
  let iterations = 0;
  for await (const buf of iter(file, { bufSize: 6 })) {
    totalSize += buf.byteLength;
    iterations += 1;
  }

  assertEquals(totalSize, 12);
  assertEquals(iterations, 2);
});

Deno.test("filesIterSync", () => {
  const file = helloWorldFile();

  let totalSize = 0;
  for (const buf of iterSync(file)) {
    totalSize += buf.byteLength;
  }

  assertEquals(totalSize, 12);
});

Deno.test("filesIterSyncCustomBufSize", () => {
  const file = helloWorldFile();

  let totalSize = 0;
  let iterations = 0;
  for (const buf of iterSync(file, { bufSize: 6 })) {
    totalSize += buf.byteLength;
    iterations += 1;
  }

  assertEquals(totalSize, 12);
  assertEquals(iterations, 2);
});

Deno.test("readerIter", async () => {
  // ref: https://github.com/denoland/deno/issues/2330
  const encoder = new TextEncoder();

  class TestReader implements Deno.Reader {
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
  for await (const buf of iter(reader)) {
    totalSize += buf.byteLength;
  }

  assertEquals(totalSize, 12);
});

Deno.test("readerIterSync", () => {
  // ref: https://github.com/denoland/deno/issues/2330
  const encoder = new TextEncoder();

  class TestReader implements Deno.ReaderSync {
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
  for await (const buf of iterSync(reader)) {
    totalSize += buf.byteLength;
  }

  assertEquals(totalSize, 12);
});
