// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/assert_equals.ts";
import { textFromReadableStream } from "./text_from_readable_stream.ts";

const textEncoder = new TextEncoder();

Deno.test("[streams] textFromReadableStream", async () => {
  const byteStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(textEncoder.encode("hello"));
      controller.enqueue(textEncoder.encode(" js "));
      controller.enqueue(textEncoder.encode("fans"));
      controller.close();
    },
  });

  assertEquals(await textFromReadableStream(byteStream), "hello js fans");

  const stringStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("hello");
      controller.enqueue(" deno ");
      controller.enqueue("world");
      controller.close();
    },
  });

  assertEquals(await textFromReadableStream(stringStream), "hello deno world");
});
