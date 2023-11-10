// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { zipReadableStreams } from "./zip_readable_streams.ts";

Deno.test("[streams] zipReadableStreams", async () => {
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

  const buf = [];
  for await (const s of zipReadableStreams(textStream, textStream2)) {
    buf.push(s);
  }

  assertEquals(buf, [
    "qwertzuiopasd",
    "mnbvcxylkjhgfdsewr",
    "mnbvcxylkjhgfds",
    "apoiuztrewq0987654321",
    "apoiuztrewq0987321",
    "qwertzuiopasq123d",
  ]);
});
