// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { ByteSliceStream } from "./byte_slice_stream.ts";

Deno.test("ByteSliceStream", async function () {
  function createStream(start = 0, end = Infinity) {
    return ReadableStream.from([
      new Uint8Array([0, 1]),
      new Uint8Array([2, 3]),
    ]).pipeThrough(new ByteSliceStream(start, end));
  }

  let chunks = await Array.fromAsync(createStream(0, 3));
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
    new Uint8Array([2, 3]),
  ]);

  chunks = await Array.fromAsync(createStream(0, 1));
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
  ]);

  chunks = await Array.fromAsync(createStream(0, 2));
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
    new Uint8Array([2]),
  ]);

  chunks = await Array.fromAsync(createStream(0, 3));
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
    new Uint8Array([2, 3]),
  ]);

  chunks = await Array.fromAsync(createStream(1, 3));
  assertEquals(chunks, [
    new Uint8Array([1]),
    new Uint8Array([2, 3]),
  ]);

  chunks = await Array.fromAsync(createStream(2, 3));
  assertEquals(chunks, [
    new Uint8Array([2, 3]),
  ]);

  chunks = await Array.fromAsync(createStream(0, 10));
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
    new Uint8Array([2, 3]),
  ]);

  assertThrows(() => createStream(-1, Infinity));
});
