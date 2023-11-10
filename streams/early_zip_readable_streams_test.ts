// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { earlyZipReadableStreams } from "./early_zip_readable_streams.ts";
import { assertEquals } from "../assert/mod.ts";

Deno.test("[streams] earlyZipReadableStreams short first", async () => {
  const textStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("1");
      controller.enqueue("2");
      controller.enqueue("3");
      controller.close();
    },
  });

  const textStream2 = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("a");
      controller.enqueue("b");
      controller.enqueue("c");
      controller.enqueue("d");
      controller.enqueue("e");
      controller.close();
    },
  });

  const buf = await Array.fromAsync(
    earlyZipReadableStreams(textStream, textStream2),
  );

  assertEquals(buf, [
    "1",
    "a",
    "2",
    "b",
    "3",
    "c",
  ]);
});

Deno.test("[streams] earlyZipReadableStreams long first", async () => {
  const textStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("a");
      controller.enqueue("b");
      controller.enqueue("c");
      controller.enqueue("d");
      controller.enqueue("e");
      controller.close();
    },
  });

  const textStream2 = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("1");
      controller.enqueue("2");
      controller.enqueue("3");
      controller.close();
    },
  });

  const buf = await Array.fromAsync(
    earlyZipReadableStreams(textStream, textStream2),
  );

  assertEquals(buf, [
    "a",
    "1",
    "b",
    "2",
    "c",
    "3",
    "d",
  ]);
});
