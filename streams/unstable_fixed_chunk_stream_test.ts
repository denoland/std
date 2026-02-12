// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertLessOrEqual } from "@std/assert";
import { FixedChunkStream } from "./unstable_fixed_chunk_stream.ts";

Deno.test("FixedChunkStream", async () => {
  const size = 512;

  const readable = ReadableStream.from(function* () {
    for (let i = 0; i < 100; ++i) {
      yield new Uint8Array(Math.random() * 1000);
    }
  }()).pipeThrough(new FixedChunkStream(size));
  const result = await Array.fromAsync(readable);

  assert(result.slice(0, -1).every((chunk) => chunk.length === size));
  assertLessOrEqual(result.at(-1)!.length, size);
});
