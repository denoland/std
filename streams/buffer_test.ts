// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  assert,
  assertEquals,
  assertRejects,
  assertThrows,
} from "../testing/asserts.ts";
import {
  Buffer,
  ByteSliceStream,
  LimitedBytesTransformStream,
  LimitedTransformStream,
} from "./buffer.ts";

Deno.test("[streams] Buffer Write & Read", async function () {
  const buf = new Buffer();
  const writer = buf.writable.getWriter();
  const reader = buf.readable.getReader({ mode: "byob" });
  const data = new Uint8Array([4, 21, 45, 19]);
  await writer.write(data);
  const read = await reader.read(new Uint8Array(4));
  assertEquals(read.value, data);
});

Deno.test("[streams] Buffer Read empty", async function () {
  const buf = new Buffer();
  const reader = buf.readable.getReader({ mode: "byob" });
  const read = await reader.read(new Uint8Array(5));
  assert(read.done);
  assertEquals(read.value!.byteLength, 0);
});

Deno.test("[streams] Buffer Write & get bytes", async function () {
  const buf = new Buffer();
  const writer = buf.writable.getWriter();
  const data = new Uint8Array([4, 21, 45, 19]);
  await writer.write(data);
  assertEquals(buf.bytes(), data);
});

Deno.test("[streams] Buffer truncate", async function () {
  const buf = new Buffer();
  const writer = buf.writable.getWriter();
  await writer.write(new Uint8Array([4, 21, 45, 19]));
  buf.truncate(3);
  assertEquals(buf.bytes(), new Uint8Array([4, 21, 45]));
});

Deno.test("[streams] LimitedBytesTransformStream", async function () {
  const r = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3]));
      controller.enqueue(new Uint8Array([4, 5, 6]));
      controller.enqueue(new Uint8Array([7, 8, 9]));
      controller.enqueue(new Uint8Array([10, 11, 12]));
      controller.enqueue(new Uint8Array([13, 14, 15]));
      controller.enqueue(new Uint8Array([16, 17, 18]));
      controller.close();
    },
  });

  const chunks = [];
  for await (const chunk of r.pipeThrough(new LimitedBytesTransformStream(7))) {
    chunks.push(chunk);
  }
  assertEquals(chunks.length, 2);
});

Deno.test("[streams] LimitedBytesTransformStream error", async function () {
  const r = new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3]));
      controller.enqueue(new Uint8Array([4, 5, 6]));
      controller.enqueue(new Uint8Array([7, 8, 9]));
      controller.enqueue(new Uint8Array([10, 11, 12]));
      controller.enqueue(new Uint8Array([13, 14, 15]));
      controller.enqueue(new Uint8Array([16, 17, 18]));
      controller.close();
    },
  });

  await assertRejects(async () => {
    for await (
      const _chunk of r.pipeThrough(
        new LimitedBytesTransformStream(7, { error: true }),
      )
    ) {
      // needed to read
    }
  }, RangeError);
});

Deno.test("[streams] LimitedTransformStream", async function () {
  const r = new ReadableStream({
    start(controller) {
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.close();
    },
  });

  const chunks = [];
  for await (const chunk of r.pipeThrough(new LimitedTransformStream(3))) {
    chunks.push(chunk);
  }
  assertEquals(chunks.length, 3);
});

Deno.test("[streams] LimitedTransformStream error", async function () {
  const r = new ReadableStream({
    start(controller) {
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.enqueue("foo");
      controller.close();
    },
  });

  await assertRejects(async () => {
    for await (
      const _chunk of r.pipeThrough(
        new LimitedTransformStream(3, { error: true }),
      )
    ) {
      // needed to read
    }
  }, RangeError);
});

Deno.test("[streams] SliceBytesStream", async function () {
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
