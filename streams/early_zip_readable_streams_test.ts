// Copyright 2018-2026 the Deno authors. MIT license.

import { earlyZipReadableStreams } from "./early_zip_readable_streams.ts";
import { assertEquals, assertRejects } from "@std/assert";

Deno.test("earlyZipReadableStreams() handles short first", async () => {
  const textStream = ReadableStream.from(["1", "2", "3"]);
  const textStream2 = ReadableStream.from(["a", "b", "c", "d", "e"]);

  const buf = await Array.fromAsync(
    earlyZipReadableStreams(textStream, textStream2),
  );

  assertEquals(buf, [
    "1",
    "a",
    "2",
    "b",
    "3",
    "c",
  ]);
});

Deno.test("earlyZipReadableStreams() handles long first", async () => {
  const textStream = ReadableStream.from(["a", "b", "c", "d", "e"]);
  const textStream2 = ReadableStream.from(["1", "2", "3"]);

  const buf = await Array.fromAsync(
    earlyZipReadableStreams(textStream, textStream2),
  );

  assertEquals(buf, [
    "a",
    "1",
    "b",
    "2",
    "c",
    "3",
    "d",
  ]);
});

Deno.test("earlyZipReadableStreams() can zip three streams", async () => {
  const textStream = ReadableStream.from(["a", "b", "c", "d", "e"]);
  const textStream2 = ReadableStream.from(["1", "2", "3"]);
  const textStream3 = ReadableStream.from(["x", "y"]);

  const buf = await Array.fromAsync(
    earlyZipReadableStreams(textStream, textStream2, textStream3),
  );

  assertEquals(buf, [
    "a",
    "1",
    "x",
    "b",
    "2",
    "y",
    "c",
    "3",
  ]);
});

Deno.test("earlyZipReadableStreams() forwards cancel()", async () => {
  const num = 10;
  let cancelled = 0;
  const streams = new Array(num).fill(false).map(() =>
    new ReadableStream(
      {
        pull(controller) {
          controller.enqueue("chunk");
        },
        cancel(reason) {
          cancelled++;
          assertEquals(reason, "I was cancelled!");
        },
      },
    )
  );

  await earlyZipReadableStreams(...streams).cancel("I was cancelled!");
  assertEquals(cancelled, num);
});

Deno.test("earlyZipReadableStreams() controller error", async () => {
  const errorMsg = "Test error";
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue("This will succeed");
    },
    pull() {
      throw new Error(errorMsg);
    },
  });

  const zippedStream = earlyZipReadableStreams(stream);
  const reader = zippedStream.getReader();

  assertEquals(await reader.read(), {
    value: "This will succeed",
    done: false,
  });
  await assertRejects(async () => await reader.read(), Error, errorMsg);
});
