// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { mergeReadableStreams, zipReadableStreams } from "./merge.ts";
import { assertEquals } from "../testing/asserts.ts";

Deno.test("[streams] mergeReadableStreams", async () => {
  const textStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("qwertzuiopasd");
      controller.enqueue("mnbvcxylkjhgfds");
      controller.enqueue("apoiuztrewq0987654321");
      controller.close();
    },
  });

  const textStream2 = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("mnbvcxylkjhgfds");
      controller.enqueue("apoiuztrewq0987654321");
      controller.enqueue("qwertzuiopasd");
      controller.close();
    },
  });

  const buf = [];
  for await (const s of mergeReadableStreams(textStream, textStream2)) {
    buf.push(s);
  }

  assertEquals(buf.sort(), [
    "apoiuztrewq0987654321",
    "apoiuztrewq0987654321",
    "mnbvcxylkjhgfds",
    "mnbvcxylkjhgfds",
    "qwertzuiopasd",
    "qwertzuiopasd",
  ]);
});

Deno.test("[streams] zipReadableStreams", async () => {
  const textStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("qwertzuiopasd");
      controller.enqueue("mnbvcxylkjhgfds");
      controller.enqueue("apoiuztrewq0987321");
      controller.close();
    },
  });

  const textStream2 = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("mnbvcxylkjhgfdsewr");
      controller.enqueue("apoiuztrewq0987654321");
      controller.enqueue("qwertzuiopasq123d");
      controller.close();
    },
  });

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
