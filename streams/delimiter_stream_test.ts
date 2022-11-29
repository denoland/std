// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import { DelimiterStream } from "./delimiter_stream.ts";
import { assert, assertEquals } from "../testing/asserts.ts";

Deno.test("[streams] DelimiterStream", async () => {
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
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(new DelimiterStream(new TextEncoder().encode("foo")))
    .pipeThrough(new TextDecoderStream());
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
