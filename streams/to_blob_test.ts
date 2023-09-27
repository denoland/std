// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assert } from "../assert/assert.ts";
import { assertEquals } from "../assert/assert_equals.ts";
import { toBlob } from "./to_blob.ts";

Deno.test("[streams] toBlob", async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(Uint8Array.of(1, 2, 3, 4, 5));
      controller.enqueue(Uint8Array.of(6, 7));
      controller.enqueue(Uint8Array.of(8, 9));
      controller.close();
    },
  });

  const blob = await toBlob(stream);
  assert(blob instanceof Blob);
  assertEquals(
    await blob.arrayBuffer(),
    Uint8Array.of(1, 2, 3, 4, 5, 6, 7, 8, 9).buffer,
  );
});
