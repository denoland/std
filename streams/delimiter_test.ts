// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.

import {
  DelimiterStream,
  TextDelimiterStream,
  TextLineStream,
} from "./delimiter.ts";
import { assert, assertEquals } from "../testing/asserts.ts";

Deno.test("[streams] TextLineStream", async () => {
  const textStream = new ReadableStream({
    start(controller) {
      controller.enqueue("qwertzu");
      controller.enqueue("iopasd\r\nmnbvc");
      controller.enqueue("xylk\rjhgfds\napoiuzt\r");
      controller.enqueue("qwr\r09ei\rqwrjiowqr\r");
      controller.enqueue("\nrewq0987\n\n654321");
      controller.enqueue("\nrewq0987\r\n\r\n654321\r");
      controller.close();
    },
  });

  const lines = [];
  for await (const chunk of textStream.pipeThrough(new TextLineStream())) {
    lines.push(chunk);
  }
  assertEquals(lines, [
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

  const textStream2 = new ReadableStream({
    start(controller) {
      controller.enqueue("rewq0987\r\n\r\n654321\n");
      controller.close();
    },
  });

  const lines2 = [];
  for await (const chunk of textStream2.pipeThrough(new TextLineStream())) {
    lines2.push(chunk);
  }
  assertEquals(lines2, [
    "rewq0987",
    "",
    "654321",
    "",
  ]);
});

Deno.test("[streams] TextLineStream - allowCR", async () => {
  const textStream = new ReadableStream({
    start(controller) {
      controller.enqueue("qwertzu");
      controller.enqueue("iopasd\r\nmnbvc");
      controller.enqueue("xylk\rjhgfds\napoiuzt\r");
      controller.enqueue("qwr\r09ei\rqwrjiowqr\r");
      controller.enqueue("\nrewq0987\n\n654321");
      controller.enqueue("\nrewq0987\r\n\r\n654321\r");
      controller.close();
    },
  });

  const lines = [];
  for await (
    const chunk of textStream.pipeThrough(new TextLineStream({ allowCR: true }))
  ) {
    lines.push(chunk);
  }
  assertEquals(lines, [
    "qwertzuiopasd",
    "mnbvcxylk",
    "jhgfds",
    "apoiuzt",
    "qwr",
    "09ei",
    "qwrjiowqr",
    "rewq0987",
    "",
    "654321",
    "rewq0987",
    "",
    "654321",
    "",
  ]);

  const textStream2 = new ReadableStream({
    start(controller) {
      controller.enqueue("rewq0987\r\n\r\n654321\n");
      controller.close();
    },
  });

  const lines2 = [];
  for await (const chunk of textStream2.pipeThrough(new TextLineStream())) {
    lines2.push(chunk);
  }
  assertEquals(lines2, [
    "rewq0987",
    "",
    "654321",
    "",
  ]);
});

Deno.test("[streams] TextLineStream - large chunks", async () => {
  const textStream = new ReadableStream({
    start(controller) {
      controller.enqueue("\n".repeat(10000));
      controller.enqueue("\n".repeat(10000));
      controller.close();
    },
  });

  let lines = 0;
  for await (const chunk of textStream.pipeThrough(new TextLineStream())) {
    assertEquals(chunk, "");
    lines++;
  }
  assertEquals(lines, 20001);
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
