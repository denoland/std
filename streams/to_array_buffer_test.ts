// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/assert_equals.ts";
import { toArrayBuffer } from "./to_array_buffer.ts";

Deno.test("[streams] toArrayBuffer", async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(Uint8Array.of(1, 2, 3, 4, 5));
      controller.enqueue(Uint8Array.of(6, 7));
      controller.enqueue(Uint8Array.of(8, 9));
      controller.close();
    },
  });

  const buf = await toArrayBuffer(stream);
  assertEquals(buf, Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8, 9).buffer);
});
