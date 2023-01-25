// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { TextDelimiterStream } from "./text_delimiter_stream.ts";
import { assert, assertEquals } from "../testing/asserts.ts";

Deno.test("[streams] TextDelimiterStream", async () => {
  const textStream = new ReadableStream({
    start(controller) {
      controller.enqueue("qwertzu");
      controller.enqueue("iopasdfoomnbvc");
      controller.enqueue("xylkjhfoogfdsapfoooiuzt");
      controller.enqueue("rewq098765432fo");
      controller.enqueue("o349012i491290");
      controller.close();
    },
  });

  const lines = textStream
    .pipeThrough(new TextDelimiterStream("foo"));
  const reader = lines.getReader();

  const a = await reader.read();
  assertEquals(a.value, "qwertzuiopasd");
  const b = await reader.read();
  assertEquals(b.value, "mnbvcxylkjh");
  const c = await reader.read();
  assertEquals(c.value, "gfdsap");
  const d = await reader.read();
  assertEquals(d.value, "oiuztrewq098765432");
  const e = await reader.read();
  assertEquals(e.value, "349012i491290");
  const f = await reader.read();
  assert(f.done);
});
