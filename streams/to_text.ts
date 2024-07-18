// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Converts a {@linkcode ReadableSteam} of strings or {@linkcode Uint8Array}s
 * to a single string. Works the same as {@linkcode Response.text}.
 *
 * @param readableStream A `ReadableStream` to convert into a `string`.
 * @returns A `Promise` that resolves to the `string`.
 *
 * @example Basic usage
 * ```ts
 * import { toText } from "@std/streams/to-text";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from(["Hello, ", "world!"]);
 * assertEquals(await toText(stream), "Hello, world!");
 * ```
 */
export async function toText(
  readableStream: ReadableStream,
): Promise<string> {
  const textDecoder = new TextDecoder();
  const reader = readableStream.getReader();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    result += typeof value === "string"
      ? value
      : textDecoder.decode(value, { stream: true });
  }
  result += textDecoder.decode();
  return result;
}
