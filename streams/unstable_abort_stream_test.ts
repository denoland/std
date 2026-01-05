// Copyright 2018-2026 the Deno authors. MIT license.

import { assertRejects } from "@std/assert";
import { FixedChunkStream } from "@std/streams/unstable-fixed-chunk-stream";
import { AbortStream } from "./unstable_abort_stream.ts";

Deno.test("AbortStream", async () => {
  const controller = new AbortController();

  const file = "./deno.json";
  const chunkSize = (await Deno.stat(file)).size / 4;
  const promise = new Response(
    (await Deno.open(file))
      .readable
      .pipeThrough(new FixedChunkStream(chunkSize)) // To make sure we aren't only given 1 chunk of the entire contents.
      .pipeThrough( // To slow the process down for the controller.abort()
        new TransformStream({
          async transform(chunk, controller) {
            await new Promise((a) => setTimeout(a, 50));
            controller.enqueue(chunk);
          },
        }),
      )
      .pipeThrough(new AbortStream(controller.signal)),
  )
    .bytes();

  setTimeout(() => controller.abort(), 75);

  await assertRejects(() => promise);
});
