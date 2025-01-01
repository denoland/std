// Copyright 2018-2025 the Deno authors. MIT license.

// This code has been ported almost directly from Go's src/bytes/buffer_test.go
// Copyright 2009 The Go Authors. All rights reserved. BSD license.
// https://github.com/golang/go/blob/master/LICENSE
import { assert, assertEquals, assertRejects, assertThrows } from "@std/assert";
import { Buffer } from "./buffer.ts";
import { writeAllSync } from "./write_all.ts";

const MAX_SIZE = 2 ** 32 - 2;
// N controls how many iterations of certain checks are performed.
const N = 100;
let testBytes: Uint8Array | undefined;
let testString: string | undefined;

const ignoreMaxSizeTests = true;

function init() {
  if (testBytes === undefined) {
    testBytes = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      testBytes[i] = "a".charCodeAt(0) + (i % 26);
    }
    const decoder = new TextDecoder();
    testString = decoder.decode(testBytes);
  }
}

function check(buf: Buffer, s: string) {
  const bytes = buf.bytes();
  assertEquals(buf.length, bytes.byteLength);
  const decoder = new TextDecoder();
  const bytesStr = decoder.decode(bytes);
  assertEquals(bytesStr, s);
  assertEquals(buf.length, s.length);
}

// Fill buf through n writes of byte slice fub.
// The initial contents of buf corresponds to the string s;
// the result is the final contents of buf returned as a string.
async function fillBytes(
  buf: Buffer,
  s: string,
  n: number,
  fub: Uint8Array,
): Promise<string> {
  check(buf, s);
  for (; n > 0; n--) {
    const m = await buf.write(fub);
    assertEquals(m, fub.byteLength);
    const decoder = new TextDecoder();
    s += decoder.decode(fub);
    check(buf, s);
  }
  return s;
}

// Empty buf through repeated reads into fub.
// The initial contents of buf corresponds to the string s.
async function empty(
  buf: Buffer,
  s: string,
  fub: Uint8Array,
) {
  check(buf, s);
  while (true) {
    const r = await buf.read(fub);
    if (r === null) {
      break;
    }
    s = s.slice(r);
    check(buf, s);
  }
  check(buf, "");
}

function repeat(c: string, bytes: number): Uint8Array {
  assertEquals(c.length, 1);
  const ui8 = new Uint8Array(bytes);
  ui8.fill(c.charCodeAt(0));
  return ui8;
}

Deno.test("Buffer", () => {
  init();
  assert(testBytes);
  assert(testString);
  const buf = new Buffer(testBytes.buffer);
  check(buf, testString);
});

Deno.test("Buffer handles basic operations", async () => {
  assert(testBytes);
  assert(testString);
  const buf = new Buffer();
  for (let i = 0; i < 5; i++) {
    check(buf, "");

    buf.reset();
    check(buf, "");

    buf.truncate(0);
    check(buf, "");

    let n = await buf.write(testBytes.subarray(0, 1));
    assertEquals(n, 1);
    check(buf, "a");

    n = await buf.write(testBytes.subarray(1, 2));
    assertEquals(n, 1);
    check(buf, "ab");

    n = await buf.write(testBytes.subarray(2, 26));
    assertEquals(n, 24);
    check(buf, testString.slice(0, 26));

    buf.truncate(26);
    check(buf, testString.slice(0, 26));

    buf.truncate(20);
    check(buf, testString.slice(0, 20));

    await empty(buf, testString.slice(0, 20), new Uint8Array(5));
    await empty(buf, "", new Uint8Array(100));

    // TODO(bartlomieju): buf.writeByte()
    // TODO(bartlomieju): buf.readByte()
  }
});

Deno.test("Buffer.read() handles empty at eof", async () => {
  // check that EOF of 'buf' is not reached (even though it's empty) if
  // results are written to buffer that has 0 length (ie. it can't store any data)
  const buf = new Buffer();
  const zeroLengthTmp = new Uint8Array(0);
  const result = await buf.read(zeroLengthTmp);
  assertEquals(result, 0);
});

Deno.test("Buffer.write() handles large bytes", async () => {
  init();
  const buf = new Buffer();
  const limit = 9;
  for (let i = 3; i < limit; i += 3) {
    const s = await fillBytes(buf, "", 5, testBytes!);
    await empty(buf, s, new Uint8Array(Math.floor(testString!.length / i)));
  }
  check(buf, "");
});

Deno.test("Buffer.grow() throws if growing beyond maximum size", async () => {
  init();
  const tmp = new Uint8Array(72);
  const growLen = Number.MAX_VALUE;
  const xBytes = repeat("x", 0);
  const buf = new Buffer(xBytes.buffer);
  await buf.read(tmp);

  assertThrows(
    () => {
      buf.grow(growLen);
    },
    Error,
    "grown beyond the maximum size",
  );
});

Deno.test({
  name: "Buffer.writeSync() grows buffer to max capacity",
  ignore: ignoreMaxSizeTests,
  fn() {
    const bufSize = 16 * 1024;
    const capacities = [MAX_SIZE, MAX_SIZE - 1];
    for (const capacity of capacities) {
      let written = 0;
      const buf = new Buffer();
      const writes = Math.floor(capacity / bufSize);
      for (let i = 0; i < writes; i++) {
        written += buf.writeSync(repeat("x", bufSize));
      }

      if (written < capacity) {
        written += buf.writeSync(repeat("x", capacity - written));
      }

      assertEquals(written, capacity);
    }
  },
});

Deno.test({
  name: "Buffer.readFrom() rejects if read max_size + 1",
  ignore: ignoreMaxSizeTests,
  async fn() {
    const reader = new Buffer(new ArrayBuffer(MAX_SIZE + 1));
    const buf = new Buffer();

    await assertRejects(
      async () => {
        await buf.readFrom(reader);
      },
      Error,
      "grown beyond the maximum size",
    );
  },
});

Deno.test({
  name: "Buffer.readFromSync() throws if read max_size + 1",
  ignore: ignoreMaxSizeTests,
  fn() {
    const reader = new Buffer(new ArrayBuffer(MAX_SIZE + 1));
    const buf = new Buffer();

    assertThrows(
      () => {
        buf.readFromSync(reader);
      },
      Error,
      "grown beyond the maximum size",
    );
  },
});

Deno.test({
  name: "Buffer.readFromSync() reads close to max_size",
  ignore: ignoreMaxSizeTests,
  fn() {
    const capacities = [MAX_SIZE, MAX_SIZE - 1];
    for (const capacity of capacities) {
      const reader = new Buffer(new ArrayBuffer(capacity));
      const buf = new Buffer();
      buf.readFromSync(reader);

      assertEquals(buf.length, capacity);
    }
  },
});

Deno.test({
  name: "Buffer.readFrom() reads close to max_size",
  ignore: ignoreMaxSizeTests,
  async fn() {
    const capacities = [MAX_SIZE, MAX_SIZE - 1];
    for (const capacity of capacities) {
      const reader = new Buffer(new ArrayBuffer(capacity));
      const buf = new Buffer();
      await buf.readFrom(reader);
      assertEquals(buf.length, capacity);
    }
  },
});

Deno.test({
  name: "Buffer.readFrom() reads close to max_size with initial grow",
  ignore: ignoreMaxSizeTests,
  async fn() {
    const capacities = [MAX_SIZE, MAX_SIZE - 1, MAX_SIZE - 512];
    for (const capacity of capacities) {
      const reader = new Buffer(new ArrayBuffer(capacity));
      const buf = new Buffer();
      buf.grow(MAX_SIZE);
      await buf.readFrom(reader);
      assertEquals(buf.length, capacity);
    }
  },
});

Deno.test("Buffer.write() handles large bytes", async () => {
  init();
  assert(testBytes);
  assert(testString);
  const buf = new Buffer();
  for (let i = 3; i < 30; i += 3) {
    const n = Math.floor(testBytes.byteLength / i);
    const s = await fillBytes(buf, "", 5, testBytes.subarray(0, n));
    await empty(buf, s, new Uint8Array(testString.length));
  }
  check(buf, "");
});

Deno.test("Buffer handles capacity with preallocated slice", () => {
  const buf = new Buffer(new ArrayBuffer(10));
  assertEquals(buf.capacity, 10);
});

Deno.test("Buffer.readFrom()", async () => {
  init();
  assert(testBytes);
  assert(testString);
  const buf = new Buffer();
  for (let i = 3; i < 30; i += 3) {
    const s = await fillBytes(
      buf,
      "",
      5,
      testBytes.subarray(0, Math.floor(testBytes.byteLength / i)),
    );
    const b = new Buffer();
    await b.readFrom(buf);
    const fub = new Uint8Array(testString.length);
    await empty(b, s, fub);
  }
  await assertRejects(async function () {
    await new Buffer().readFrom(null!);
  });
});

Deno.test("Buffer.readFromSync()", async () => {
  init();
  assert(testBytes);
  assert(testString);
  const buf = new Buffer();
  for (let i = 3; i < 30; i += 3) {
    const s = await fillBytes(
      buf,
      "",
      5,
      testBytes.subarray(0, Math.floor(testBytes.byteLength / i)),
    );
    const b = new Buffer();
    b.readFromSync(buf);
    const fub = new Uint8Array(testString.length);
    await empty(b, s, fub);
  }
  assertThrows(function () {
    new Buffer().readFromSync(null!);
  });
});

Deno.test("Buffer.grow()", async () => {
  const tmp = new Uint8Array(72);
  for (const startLen of [0, 100, 1000, 10000]) {
    const xBytes = repeat("x", startLen);
    for (const growLen of [0, 100, 1000, 10000]) {
      const buf = new Buffer(xBytes.buffer);
      // If we read, this affects buf.off, which is good to test.
      const nread = (await buf.read(tmp)) ?? 0;
      buf.grow(growLen);
      const yBytes = repeat("y", growLen);
      await buf.write(yBytes);
      // Check that buffer has correct data.
      assertEquals(
        buf.bytes().subarray(0, startLen - nread),
        xBytes.subarray(nread),
      );
      assertEquals(
        buf.bytes().subarray(startLen - nread, startLen - nread + growLen),
        yBytes,
      );
    }
  }
});

Deno.test("Buffer.write() and Buffer.readFromSync()", () => {
  // defaults to copy
  const args = [undefined, { copy: true }] as const;
  for (const arg of args) {
    const bufSize = 64 * 1024;
    const bytes = new TextEncoder().encode("a".repeat(bufSize));
    const reader = new Buffer();
    writeAllSync(reader, bytes);

    const writer = new Buffer();
    writer.readFromSync(reader);
    const actualBytes = writer.bytes(arg);

    assertEquals(actualBytes.byteLength, bufSize);
    assert(actualBytes.buffer !== writer.bytes(arg).buffer);
    assertEquals(actualBytes.byteLength, actualBytes.buffer.byteLength);
  }
});

Deno.test("Buffer.bytes() with copy set to false", () => {
  const bufSize = 64 * 1024;
  const bytes = new TextEncoder().encode("a".repeat(bufSize));
  const reader = new Buffer();
  writeAllSync(reader, bytes);

  const writer = new Buffer();
  writer.readFromSync(reader);
  const actualBytes = writer.bytes({ copy: false });

  assertEquals(actualBytes.byteLength, bufSize);
  assertEquals(actualBytes.buffer, writer.bytes({ copy: false }).buffer);
  assert(actualBytes.buffer.byteLength > actualBytes.byteLength);
});

Deno.test("Buffer.bytes() with copy set to false after Buffer.grow()", () => {
  const bufSize = 64 * 1024;
  const bytes = new TextEncoder().encode("a".repeat(bufSize));
  const reader = new Buffer();
  writeAllSync(reader, bytes);

  const writer = new Buffer();
  writer.grow(bufSize);
  writer.readFromSync(reader);
  const actualBytes = writer.bytes({ copy: false });

  assertEquals(actualBytes.byteLength, bufSize);
  assertEquals(actualBytes.buffer.byteLength, actualBytes.byteLength);
});
