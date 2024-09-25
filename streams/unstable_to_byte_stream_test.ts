// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { toByteStream } from "./unstable_to_byte_stream.ts";

Deno.test("toByteStream() consumable as BYOB", async () => {
  const size = 100;

  const reader = toByteStream(
    ReadableStream.from([
      new Uint8Array(size),
      new Uint8Array(size * 0),
      new Uint8Array(size * 2),
      new Uint8Array(size * 3),
    ]),
  )
    .getReader({ mode: "byob" });

  let count = 0;
  while (true) {
    const { done, value } = await reader.read(new Uint8Array(10));
    if (done) break;
    count += value.length;
  }

  assertEquals(count, size * 6);
});

Deno.test("toByteStream() consumable as default", async () => {
  const size = 100;

  const reader = toByteStream(
    ReadableStream.from([
      new Uint8Array(size),
      new Uint8Array(size * 0),
      new Uint8Array(size * 2),
      new Uint8Array(size * 3),
    ]),
  )
    .getReader();

  let count = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    count += value.length;
  }

  assertEquals(count, size * 6);
});

Deno.test("toByteStream() cancellable", async () => {
  let receivedCancel = false;

  const readable = toByteStream(
    new ReadableStream({
      pull(controller) {
        controller.enqueue(new Uint8Array(100));
      },
      cancel(reason) {
        receivedCancel = true;
        assertEquals(reason, "Potato");
      },
    }),
  );

  await readable.cancel("Potato");
  assertEquals(receivedCancel, true);
});
