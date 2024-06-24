// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { toLines } from "./to_lines.ts";
import { assertEquals } from "@std/assert";

Deno.test("toLines parses simple input", async () => {
  const stream = ReadableStream.from([
    "qwertzu",
    "iopasd\r\nmnbvc",
    "xylk\rjhgfds\napoiuzt\r",
    "qwr\r09ei\rqwrjiowqr\r",
    "\nrewq0987\n\n654321",
    "\nrewq0987\r\n\r\n654321\r",
  ]);

  assertEquals(await Array.fromAsync(toLines(stream)), [
    "qwertzuiopasd",
    "mnbvcxylk\rjhgfds",
    "apoiuzt\rqwr\r09ei\rqwrjiowqr",
    "rewq0987",
    "",
    "654321",
    "rewq0987",
    "",
    "654321\r",
  ]);

  const stream2 = ReadableStream.from("rewq0987\r\n\r\n654321\n");

  assertEquals(await Array.fromAsync(toLines(stream2)), [
    "rewq0987",
    "",
    "654321",
  ]);
});

Deno.test("toLines parses large chunks", async () => {
  const totalLines = 20_000;
  const stream = ReadableStream.from("\n".repeat(totalLines));
  const lines = await Array.fromAsync(toLines(stream));

  assertEquals(lines.length, totalLines);
  assertEquals(lines, Array.from({ length: totalLines }).fill(""));
});

Deno.test("toLines converts Uint8Array chunks to strings", async () => {
  const stream = ReadableStream.from([
    Uint8Array.from([72, 101, 108, 108, 111]),
    Uint8Array.from([10, 87, 111, 114, 108, 100, 33, 10]),
  ]);

  assertEquals(await Array.fromAsync(toLines(stream)), ["Hello", "World!"]);
});
