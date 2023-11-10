// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { mergeReadableStreams } from "./merge_readable_streams.ts";
import { assertEquals } from "../assert/mod.ts";

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

Deno.test("[streams] mergeReadableStreams - handling errors", async () => {
  const textStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("1");
      controller.enqueue("3");
      controller.close();
    },
  });

  const textStream2 = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("2");
      controller.enqueue("4");
      controller.close();
    },
  });

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
