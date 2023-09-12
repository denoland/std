// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/assert_equals.ts";
import { toText } from "./to_text.ts";

const textEncoder = new TextEncoder();

Deno.test("[streams] toText", async () => {
  const byteStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(textEncoder.encode("hello"));
      controller.enqueue(textEncoder.encode(" js "));
      controller.enqueue(textEncoder.encode("fans"));
      controller.close();
    },
  });

  assertEquals(await toText(byteStream), "hello js fans");

  const stringStream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue("hello");
      controller.enqueue(" deno ");
      controller.enqueue("world");
      controller.close();
    },
  });

  assertEquals(await toText(stringStream), "hello deno world");
});
