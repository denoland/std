// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

// This code has been ported almost directly from Go's src/bytes/buffer_test.go
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE

import { copy } from "../bytes/mod.ts";
import {
  assert,
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import { Buffer } from "./buffer.ts";
import {
  iter,
  iterSync,
  readAll,
  readAllSync,
  readRange,
  readRangeSync,
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
  const reader = new Buffer(testBytes.buffer);
  const actualBytes = await readAll(reader);
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

Deno.test("testReadAllSync", () => {
  init();
  assert(testBytes);
  const reader = new Buffer(testBytes.buffer);
  const actualBytes = readAllSync(reader);
  assertEquals(testBytes.byteLength, actualBytes.byteLength);
  for (let i = 0; i < testBytes.length; ++i) {
    assertEquals(testBytes[i], actualBytes[i]);
  }
});

class MockFile
  implements
    Deno.Seeker,
    Deno.SeekerSync,
    Deno.Reader,
    Deno.ReaderSync,
    Deno.Closer {
  #buf: Uint8Array;
  #closed = false;
  #offset = 0;

  get closed() {
    return this.#closed;
  }

  constructor(buf: Uint8Array) {
    this.#buf = buf;
  }

  close() {
    this.#closed = true;
  }

  read(p: Uint8Array): Promise<number | null> {
    if (this.#offset >= this.#buf.length) {
      return Promise.resolve(null);
    }
    const nread = Math.min(p.length, 16_384, this.#buf.length - this.#offset);
    if (nread === 0) {
      return Promise.resolve(0);
    }
    copy(this.#buf.subarray(this.#offset, this.#offset + nread), p);
    this.#offset += nread;
    return Promise.resolve(nread);
  }

  readSync(p: Uint8Array): number | null {
    if (this.#offset >= this.#buf.length) {
      return null;
    }
    const nread = Math.min(p.length, 16_384, this.#buf.length - this.#offset);
    if (nread === 0) {
      return 0;
    }
    copy(this.#buf.subarray(this.#offset, this.#offset + nread), p);
    this.#offset += nread;
    return nread;
  }

  seek(offset: number, whence: Deno.SeekMode): Promise<number> {
    assert(whence === Deno.SeekMode.Start);
    if (offset >= this.#buf.length) {
      return Promise.reject(new RangeError("seeked pass end"));
    }
    this.#offset = offset;
    return Promise.resolve(this.#offset);
  }

  seekSync(offset: number, whence: Deno.SeekMode): number {
    assert(whence === Deno.SeekMode.Start);
    if (offset >= this.#buf.length) {
      throw new RangeError("seeked pass end");
    }
    this.#offset = offset;
    return this.#offset;
  }
}

Deno.test({
  name: "readRange",
  async fn() {
    init();
    assert(testBytes);
    const file = new MockFile(testBytes);
    const actual = await readRange(file, { start: 0, end: 9 });
    assertEquals(actual, testBytes.subarray(0, 10));
  },
});

Deno.test({
  name: "readRange - invalid range",
  async fn() {
    init();
    assert(testBytes);
    const file = new MockFile(testBytes);
    await assertRejects(
      async () => {
        await readRange(file, { start: 100, end: 0 });
      },
      Error,
      "Invalid byte range was passed.",
    );
  },
});

Deno.test({
  name: "readRange - read past EOF",
  async fn() {
    init();
    assert(testBytes);
    const file = new MockFile(testBytes);
    await assertRejects(
      async () => {
        await readRange(file, { start: 99, end: 100 });
      },
      Error,
      "Unexpected EOF reach while reading a range.",
    );
  },
});

Deno.test({
  name: "readRangeSync",
  fn() {
    init();
    assert(testBytes);
    const file = new MockFile(testBytes);
    const actual = readRangeSync(file, { start: 0, end: 9 });
    assertEquals(actual, testBytes.subarray(0, 10));
  },
});

Deno.test({
  name: "readRangeSync - invalid range",
  fn() {
    init();
    assert(testBytes);
    const file = new MockFile(testBytes);
    assertThrows(
      () => {
        readRangeSync(file, { start: 100, end: 0 });
      },
      Error,
      "Invalid byte range was passed.",
    );
  },
});

Deno.test({
  name: "readRangeSync - read past EOF",
  fn() {
    init();
    assert(testBytes);
    const file = new MockFile(testBytes);
    assertThrows(
      () => {
        readRangeSync(file, { start: 99, end: 100 });
      },
      Error,
      "Unexpected EOF reach while reading a range.",
    );
  },
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
  for (const buf of iterSync(reader)) {
    totalSize += buf.byteLength;
  }

  assertEquals(totalSize, 12);
});
