// Copyright 2018-2025 the Deno authors. MIT license.

import { mergeReadableStreams } from "./merge_readable_streams.ts";
import { assertEquals } from "@std/assert";

Deno.test("mergeReadableStreams()", async () => {
  const textStream = ReadableStream.from([
    "qwertzuiopasd",
    "mnbvcxylkjhgfds",
    "apoiuztrewq0987654321",
  ]);

  const textStream2 = ReadableStream.from([
    "mnbvcxylkjhgfds",
    "apoiuztrewq0987654321",
    "qwertzuiopasd",
  ]);

  const buf = await Array.fromAsync(
    mergeReadableStreams(textStream, textStream2),
  );

  assertEquals(buf.sort(), [
    "apoiuztrewq0987654321",
    "apoiuztrewq0987654321",
    "mnbvcxylkjhgfds",
    "mnbvcxylkjhgfds",
    "qwertzuiopasd",
    "qwertzuiopasd",
  ]);
});

Deno.test("mergeReadableStreams() handles errors", async () => {
  const textStream = ReadableStream.from(["1", "3"]);

  const textStream2 = ReadableStream.from(["2", "4"]);

  const buf = [];
  try {
    for await (const s of mergeReadableStreams(textStream, textStream2)) {
      buf.push(s);
      if (s === "2") {
        throw new Error("error");
      }
    }
    throw new Error("should not be here");
  } catch (error) {
    assertEquals((error as Error).message, "error");
    assertEquals(buf, ["1", "2"]);
  }
});
