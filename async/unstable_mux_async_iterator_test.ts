// Copyright 2018-2026 the Deno authors. MIT license.
import { assertEquals } from "@std/assert";
import { MuxAsyncIterator } from "./unstable_mux_async_iterator.ts";

async function* gen123(): AsyncIterableIterator<number> {
  yield 1;
  yield 2;
  yield 3;
}

async function* gen456(): AsyncIterableIterator<number> {
  yield 4;
  yield 5;
  yield 6;
}

Deno.test("(unstable) MuxAsyncIterator() works with constructor iterables", async () => {
  const mux = new MuxAsyncIterator(gen123(), gen456());
  const results = new Set(await Array.fromAsync(mux));
  assertEquals(results.size, 6);
  assertEquals(results, new Set([1, 4, 2, 5, 3, 6]));
});
