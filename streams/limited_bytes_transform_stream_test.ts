// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import { LimitedBytesTransformStream } from "./limited_bytes_transform_stream.ts";

Deno.test("LimitedBytesTransformStream - specified size is the boundary of the chunks", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(6));

  const chunks = await Array.fromAsync(r);
  assertEquals(chunks, [
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
  ]);
});

Deno.test("LimitedBytesTransformStream - specified size is not the boundary of the chunks", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(7));

  const chunks = await Array.fromAsync(r);
  assertEquals(chunks, [
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
  ]);
});

Deno.test("LimitedBytesTransformStream - specified size is 0", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(0));

  const chunks = await Array.fromAsync(r);
  assertEquals(chunks.length, 0);
});

Deno.test("LimitedBytesTransformStream - specified size is equal to the total size of the chunks", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(18));

  const chunks = await Array.fromAsync(r);
  assertEquals(chunks, [
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]);
});

Deno.test("LimitedBytesTransformStream - specified size is greater than the total size of the chunks", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(19));

  const chunks = await Array.fromAsync(r);
  assertEquals(chunks, [
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]);
});

Deno.test("LimitedBytesTransformStream - error is set to true and the specified size is 0", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(0, { error: true }));

  await assertRejects(async () => await Array.fromAsync(r), RangeError);
});

Deno.test("LimitedBytesTransformStream - error is set to true and the specified size is the boundary of the chunks", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(6, { error: true }));

  await assertRejects(async () => await Array.fromAsync(r), RangeError);
});

Deno.test("LimitedBytesTransformStream - error is set to true and the specified size is not the boundary of the chunks", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(7, { error: true }));

  await assertRejects(async () => await Array.fromAsync(r), RangeError);
});

Deno.test("LimitedBytesTransformStream - error is set to true and specified size is equal to the total size of the chunks", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(18, { error: true }));

  const chunks = await Array.fromAsync(r);
  assertEquals(chunks, [
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]);
});

Deno.test("LimitedBytesTransformStream - error is set to true and specified size is greater than the total size of the chunks", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]).pipeThrough(new LimitedBytesTransformStream(19, { error: true }));

  const chunks = await Array.fromAsync(r);
  assertEquals(chunks, [
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]);
});
