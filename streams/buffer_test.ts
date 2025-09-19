// Copyright 2018-2025 the Deno authors. MIT license.

import { assert, assertEquals, assertThrows } from "@std/assert";
import { Buffer } from "./buffer.ts";

Deno.test("Buffer handles write and read", async () => {
  const buf = new Buffer();
  const writer = buf.writable.getWriter();
  const reader = buf.readable.getReader({ mode: "byob" });
  const data = new Uint8Array([4, 21, 45, 19]);
  await writer.write(data);
  const read = await reader.read(new Uint8Array(4));
  assertEquals(read.value, data);
});

Deno.test("Buffer can constrruct with initial data", async () => {
  const data = new Uint8Array([4, 21, 45, 19]);
  const buf = new Buffer(data);
  const reader = buf.readable.getReader({ mode: "byob" });
  const read = await reader.read(new Uint8Array(4));
  assertEquals(read.value, data);
});

Deno.test("Buffer handles read empty", async function () {
  const buf = new Buffer();
  const reader = buf.readable.getReader({ mode: "byob" });
  const read = await reader.read(new Uint8Array(5));
  assert(read.done);
  assertEquals(read.value!.byteLength, 0);
});

Deno.test("Buffer handles write and get bytes", async () => {
  const buf = new Buffer();
  const writer = buf.writable.getWriter();
  const data = new Uint8Array([4, 21, 45, 19]);
  await writer.write(data);
  assertEquals(buf.bytes(), data);
});

Deno.test("Buffer.truncate(n) truncates the data except the first n bytes", async () => {
  const buf = new Buffer();
  const writer = buf.writable.getWriter();
  await writer.write(new Uint8Array([4, 21, 45, 19]));
  buf.truncate(3);
  assertEquals(buf.bytes(), new Uint8Array([4, 21, 45]));
});

Deno.test("Buffer.truncate(0) truncates the entire buffer", async () => {
  const data = new Uint8Array([4, 21, 45, 19]);
  const buf = new Buffer(data.buffer);
  buf.truncate(0);
  assertEquals(await buf.bytes(), new Uint8Array(0));
});

Deno.test("Buffer.truncate(n) throws if n is negative", () => {
  const buf = new Buffer();
  assertThrows(
    () => {
      buf.truncate(-1);
    },
    RangeError,
    'Buffer truncation value "-1" is not between 0 and 0',
  );
});

Deno.test("Buffer.truncate(n) throws if n is greater than the length of the buffer", () => {
  const buf = new Buffer();
  assertThrows(
    () => {
      buf.truncate(1);
    },
    RangeError,
    'Buffer truncation value "1" is not between 0 and 0',
  );
});

Deno.test("Buffer.bytes({ copy: false }) returns subarray, not an slice", () => {
  const data = new Uint8Array([4, 21, 45, 19]);
  const buf = new Buffer(data.buffer);
  const subarray = buf.bytes({ copy: false });
  subarray.set([0, 0], 0);
  // The original array is affected
  assertEquals(data, new Uint8Array([0, 0, 45, 19]));
});

Deno.test("Buffer.grow(n) allocates necessary array buffer (increases the capacity of the buffer) if necessary", () => {
  const buf = new Buffer();
  assertEquals(buf.capacity, 0);
  buf.grow(10);
  assertEquals(buf.capacity, 10);
});

Deno.test("Buffer.grow(n) doesn't allocate a new array buffer if it has enough capacity", async () => {
  const buf = new Buffer(new Uint8Array(100).buffer);
  buf.reset();
  assertEquals(buf.capacity, 100);
  await buf.writable.getWriter().write(new Uint8Array([4, 21, 45, 19]));
  await buf.readable.getReader({ mode: "byob" }).read(new Uint8Array(4));
  buf.grow(10);
  assertEquals(buf.capacity, 100);
});

Deno.test("Buffer.grow(n) slides down the unread data if the required n + buf.length <= buf.capacity / 2", async () => {
  const array = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const buf = new Buffer(array.buffer);
  await buf.readable.getReader({ mode: "byob" }).read(new Uint8Array(8)); // read 8 bytes
  buf.grow(2); // grow the buffer by 2 bytes
  assertEquals(buf.bytes(), new Uint8Array([8, 9]));
  assertEquals(array, new Uint8Array([8, 9, 2, 3, 4, 5, 6, 7, 8, 9]));
});

Deno.test("Buffer.grow(n) throws an error if n is a negative value", () => {
  const buf = new Buffer();
  assertThrows(
    () => {
      buf.grow(-1);
    },
    RangeError,
    "Cannot grow buffer as growth must be positive: received -1",
  );
});

Deno.test("Buffer.grow(n) throws if the total of byte size exceeds 2 ** 32 - 2", () => {
  const buf = new Buffer();
  assertThrows(
    () => {
      buf.grow(2 ** 32);
    },
    RangeError,
    "The buffer cannot grow beyond the maximum size of",
  );
});
