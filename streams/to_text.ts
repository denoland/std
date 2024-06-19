// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

const textDecoder = new TextDecoder();

/**
 * Converts a {@linkcode ReadableSteam} of {@linkcode Uint8Array}s to a single
 * string. Works the same as {@linkcode Request.text} and
 * {@linkcode Response.text}.
 *
 * @param readableStream A `ReadableStream` to convert into a `string`.
 * @returns A `Promise` that resolves to the `string`.
 *
 * @example Basic usage
 * ```ts
 * import { toText } from "@std/streams/to-text";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const stream = ReadableStream.from(["Hello, ", "world!"])
 *   .pipeThrough(new TextEncoderStream());
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 */
export async function toText(
  readableStream: ReadableStream<Uint8Array>,
): Promise<string> {
  const reader = readableStream.getReader();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    result += textDecoder.decode(value);
  }

  return result;
}
