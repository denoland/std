// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { ProgressBarStream } from "./unstable_progress_bar_stream.ts";

async function* getData(
  loops: number,
  bufferSize: number,
): AsyncGenerator<Uint8Array> {
  for (let i = 0; i < loops; ++i) {
    yield new Uint8Array(bufferSize);
    await new Promise((a) => setTimeout(a, Math.random() * 500 + 500));
  }
}

Deno.test("ProgressBarStream() flushes", async () => {
  const { readable, writable } = new TransformStream();

  for await (
    const _ of ReadableStream
      .from(getData(10, 1000))
      .pipeThrough(
        new ProgressBarStream({ writable, max: 10 * 1000, keepOpen: false }),
      )
    // deno-lint-ignore no-empty
  ) {}

  assertEquals((await new Response(readable).bytes()).subarray(-1)[0], 10);
});

Deno.test("ProgressBarStream() cancels", async () => {
  const { readable, writable } = new TransformStream();

  await ReadableStream
    .from(getData(10, 1000))
    .pipeThrough(
      new ProgressBarStream({ writable, max: 10 * 1000, keepOpen: false }),
    )
    .cancel();

  assertEquals((await new Response(readable).bytes()).subarray(-1)[0], 10);
});
