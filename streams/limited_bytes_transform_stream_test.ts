// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../assert/mod.ts";
import { LimitedBytesTransformStream } from "./limited_bytes_transform_stream.ts";

Deno.test("[streams] LimitedBytesTransformStream", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]);

  const chunks = [];
  for await (const chunk of r.pipeThrough(new LimitedBytesTransformStream(7))) {
    chunks.push(chunk);
  }
  assertEquals(chunks.length, 2);
});

Deno.test("[streams] LimitedBytesTransformStream error", async function () {
  const r = ReadableStream.from([
    new Uint8Array([1, 2, 3]),
    new Uint8Array([4, 5, 6]),
    new Uint8Array([7, 8, 9]),
    new Uint8Array([10, 11, 12]),
    new Uint8Array([13, 14, 15]),
    new Uint8Array([16, 17, 18]),
  ]);

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
