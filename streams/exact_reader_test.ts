// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals } from "../assert/equals.ts";
import { ExactReader } from "./exact_reader.ts";

Deno.test("ExactReader test", async () => {
  const readable = ReadableStream.from(async function* () {
    for (let i = 0; i < 1024; ++i) {
      yield new Uint8Array(Math.floor(Math.random() * 1024));
    }
  }());

  const reader = new ExactReader(readable);
  const read = Math.ceil(Math.random() * 2048);
  const sizes: number[] = [];
  while (true) {
    const { done, value } = await reader.read(new Uint8Array(read));
    if (done) {
      break;
    }
    sizes.push(value.length);
  }

  sizes.pop(); // Last value isn't guaranteed to be size `read`
  for (const size of sizes) {
    assertEquals(size, read);
  }
});
