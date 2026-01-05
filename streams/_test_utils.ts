// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";

/**
 * Verify that a transform stream produces the expected output data
 * @param transform The transform stream to test
 * @param inputs Source input data
 * @param outputs Expected output data
 */
export async function testTransformStream<T, U>(
  transform: TransformStream<T, U>,
  inputs: Iterable<T> | AsyncIterable<T>,
  outputs: Iterable<U> | AsyncIterable<U>,
) {
  const reader = ReadableStream.from(inputs)
    .pipeThrough(transform)
    .getReader();
  for await (const output of outputs) {
    const { value, done } = await reader.read();
    assertEquals(value, output);
    assertEquals(done, false);
  }
  const f = await reader.read();
  assert(f.done, `stream not done, value was: ${f.value}`);
}
