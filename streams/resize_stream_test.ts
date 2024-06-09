// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { ResizeStream } from "./resize_stream.ts";

Deno.test("ResizeStream", async () => {
  const readable = ReadableStream.from(function* () {
    for (let i = 0; i < 100; ++i) {
      yield new Uint8Array(Math.floor(Math.random() * 1000));
    }
  }())
    .pipeThrough(new ResizeStream(512));

  assertEquals(
    (await Array.fromAsync(readable))
      .slice(0, -1)
      .every((chunk) => chunk.length === 512),
    true,
  );
});
