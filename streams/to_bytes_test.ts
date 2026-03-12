// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import { toBytes } from "./to_bytes.ts";

Deno.test("toBytes() concatenates multiple chunks", async () => {
  const stream = ReadableStream.from([
    new Uint8Array([1, 2, 3, 4, 5]),
    new Uint8Array([6, 7]),
    new Uint8Array([8, 9]),
  ]);

  const bytes = await toBytes(stream);
  assertEquals(bytes, new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
});

Deno.test("toBytes() returns empty Uint8Array for empty stream", async () => {
  const stream = ReadableStream.from([]);
  const bytes = await toBytes(stream);
  assertEquals(bytes, new Uint8Array());
});

Deno.test("toBytes() rejects when stream errors", async () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.error(new Error("boom"));
    },
  });

  await assertRejects(
    () => toBytes(stream),
    Error,
    "boom",
  );
});
