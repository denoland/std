// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertRejects } from "../assert/mod.ts";
import { LimitedTransformStream } from "./limited_transform_stream.ts";

Deno.test("[streams] LimitedTransformStream", async function () {
  const r = ReadableStream.from([
    "foo",
    "foo",
    "foo",
    "foo",
    "foo",
    "foo",
  ]);

  const chunks = [];
  for await (const chunk of r.pipeThrough(new LimitedTransformStream(3))) {
    chunks.push(chunk);
  }
  assertEquals(chunks.length, 3);
});

Deno.test("[streams] LimitedTransformStream error", async function () {
  const r = ReadableStream.from([
    "foo",
    "foo",
    "foo",
    "foo",
    "foo",
    "foo",
  ]);

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
