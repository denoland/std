// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  DelimiterStream,
  LineStream,
  TextDelimiterStream,
  TextLineStream,
} from "./delimiter.ts";
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

Deno.test("[streams] TextLineStream", async () => {
  const textStream = new ReadableStream({
    start(controller) {
      controller.enqueue("qwertzu");
      controller.enqueue("iopasd\r\nmnbvc");
      controller.enqueue("xylk\njhgfds\napoiuzt");
      controller.enqueue("qwr09eiqwrjiowqr\r");
      controller.enqueue("\nrewq0987\n\n654321");
      controller.enqueue("\nrewq0987\r\n\r\n654321");
      controller.close();
    },
  });

  const lines = textStream.pipeThrough(new TextLineStream());
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
  assertEquals(e.value, "rewq0987");
  const f = await reader.read();
  assertEquals(f.value, "");
  const g = await reader.read();
  assertEquals(g.value, "654321");
  const h = await reader.read();
  assertEquals(h.value, "rewq0987");
  const i = await reader.read();
  assertEquals(i.value, "");
  const j = await reader.read();
  assertEquals(j.value, "654321");
  const k = await reader.read();
  assert(k.done);
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
