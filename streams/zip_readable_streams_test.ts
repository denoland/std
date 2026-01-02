// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertRejects } from "@std/assert";
import { zipReadableStreams } from "./zip_readable_streams.ts";

Deno.test("zipReadableStreams()", async () => {
  const textStream = ReadableStream.from([
    "qwertzuiopasd",
    "mnbvcxylkjhgfds",
    "apoiuztrewq0987321",
  ]);

  const textStream2 = ReadableStream.from([
    "mnbvcxylkjhgfdsewr",
    "apoiuztrewq0987654321",
    "qwertzuiopasq123d",
  ]);

  const buf = await Array.fromAsync(
    zipReadableStreams(textStream, textStream2),
  );

  assertEquals(buf, [
    "qwertzuiopasd",
    "mnbvcxylkjhgfdsewr",
    "mnbvcxylkjhgfds",
    "apoiuztrewq0987654321",
    "apoiuztrewq0987321",
    "qwertzuiopasq123d",
  ]);
});

Deno.test("zipReadableStreams handles errors by closing the stream with an error", async () => {
  const errorStream = new ReadableStream({
    start(controller) {
      controller.enqueue("Initial data");
    },
    pull() {
      throw new Error("Test error during read");
    },
  });
  const normalStream = ReadableStream.from(["Normal data"]);
  const zippedStream = zipReadableStreams(errorStream, normalStream);
  const reader = zippedStream.getReader();

  assertEquals(await reader.read(), { value: "Initial data", done: false });
  assertEquals(await reader.read(), { value: "Normal data", done: false });
  await assertRejects(
    async () => await reader.read(),
    Error,
    "Test error during read",
  );
});
