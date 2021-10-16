// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { DelimiterStream, LineStream } from "./delimiter.ts";
import { assert, assertEquals } from "../testing/asserts.ts";

Deno.test("[streams] LineStream", async () => {
  const textStream = new ReadableStream({
    start(controller) {
      controller.enqueue("qwertzu");
      controller.enqueue("iopasd\r\nmnbvc");
      controller.enqueue("xylk\njhgfds\napoiuzt");
      controller.enqueue("qwr09eiqwrjiowqr\r");
      controller.enqueue("\nrewq0987654321");
      controller.close();
    },
  });

  const lines = textStream
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(new LineStream())
    .pipeThrough(new TextDecoderStream());
  const reader = lines.getReader();

  const a = await reader.read();
  assertEquals(a.value, "qwertzuiopasd");
  const b = await reader.read();
  assertEquals(b.value, "mnbvcxylk");
  const c = await reader.read();
  assertEquals(c.value, "jhgfds");
  const d = await reader.read();
  assertEquals(d.value, "apoiuztqwr09eiqwrjiowqr");
  const e = await reader.read();
  assertEquals(e.value, "rewq0987654321");
  const f = await reader.read();
  assert(f.done);
});

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
