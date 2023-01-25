// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../testing/asserts.ts";
import { zipReadableStreams } from "./zip_readable_streams.ts";

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
