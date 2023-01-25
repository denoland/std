// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../testing/asserts.ts";
import { LimitedBytesTransformStream } from "./limited_bytes_transform_stream.ts";

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
