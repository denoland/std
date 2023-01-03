// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { ByteSliceStream } from "./byte_slice_stream.ts";

Deno.test("[streams] ByteSliceStream", async function () {
  function createStream(start = 0, end = Infinity) {
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array([0, 1]));
        controller.enqueue(new Uint8Array([2, 3]));
        controller.close();
      },
    }).pipeThrough(new ByteSliceStream(start, end));
  }

  let chunks = [];

  for await (const chunk of createStream(0, 3)) {
    chunks.push(chunk);
  }
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
    new Uint8Array([2, 3]),
  ]);

  chunks = [];
  for await (const chunk of createStream(0, 1)) {
    chunks.push(chunk);
  }
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
  ]);

  chunks = [];
  for await (const chunk of createStream(0, 2)) {
    chunks.push(chunk);
  }
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
    new Uint8Array([2]),
  ]);

  chunks = [];
  for await (const chunk of createStream(0, 3)) {
    chunks.push(chunk);
  }
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
    new Uint8Array([2, 3]),
  ]);

  chunks = [];
  for await (const chunk of createStream(1, 3)) {
    chunks.push(chunk);
  }
  assertEquals(chunks, [
    new Uint8Array([1]),
    new Uint8Array([2, 3]),
  ]);

  chunks = [];
  for await (const chunk of createStream(2, 3)) {
    chunks.push(chunk);
  }
  assertEquals(chunks, [
    new Uint8Array([2, 3]),
  ]);

  chunks = [];
  for await (const chunk of createStream(0, 10)) {
    chunks.push(chunk);
  }
  assertEquals(chunks, [
    new Uint8Array([0, 1]),
    new Uint8Array([2, 3]),
  ]);

  assertThrows(() => createStream(-1, Infinity));
});
