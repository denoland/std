// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import { LimitedTransformStream } from "./limited_transform_stream.ts";

Deno.test("LimitedTransformStream", async function () {
  const r = ReadableStream.from([
    "foo",
    "foo",
    "foo",
    "foo",
    "foo",
    "foo",
  ]).pipeThrough(new LimitedTransformStream(3));

  const chunks = await Array.fromAsync(r);
  assertEquals(chunks, [
    "foo",
    "foo",
    "foo",
  ]);
});

Deno.test("LimitedTransformStream handles error", async function () {
  const r = ReadableStream.from([
    "foo",
    "foo",
    "foo",
    "foo",
    "foo",
    "foo",
  ]).pipeThrough(new LimitedTransformStream(3, { error: true }));

  await assertRejects(async () => await Array.fromAsync(r), RangeError);
});
