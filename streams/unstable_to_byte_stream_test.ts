// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { toByteStream } from "./unstable_to_byte_stream.ts";

Deno.test(
  "toByteStream() consumable as BYOB with min property set",
  async () => {
    let size = 0;
    const reader = toByteStream(ReadableStream.from(async function* () {
      for (let i = 0; i < 100; ++i) {
        const bytes = Math.floor(Math.random() * 10 + 5);
        size += bytes;
        yield new Uint8Array(bytes).map((_) => Math.random() * 256);
      }
    }())).getReader({ mode: "byob" });

    let count = 0;
    while (true) {
      const { done, value } = await reader.read(new Uint8Array(10), {
        min: 10,
      });
      if (done) {
        count += value!.length;
        break;
      }
      count += value.length;
    }

    assertEquals(count, size);
  },
);

Deno.test("toByteStream() consumable as BYOB", async () => {
  const size = 100;

  const reader = toByteStream(
    ReadableStream.from([
      new Uint8Array(size),
      new Uint8Array(size * 0),
      new Uint8Array(size * 2),
      new Uint8Array(5),
      new Uint8Array(3),
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

  assertEquals(count, size * 6 + 5 + 3);
});

Deno.test("toByteStream() consumable as default", async () => {
  const size = 100;

  const reader = toByteStream(
    ReadableStream.from([
      new Uint8Array(size),
      new Uint8Array(size * 0),
      new Uint8Array(size * 2),
      new Uint8Array(5),
      new Uint8Array(3),
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

  assertEquals(count, size * 6 + 5 + 3);
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
