// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { toText } from "./to_text.ts";

/**
 * Converts a JSON-formatted {@linkcode ReadableSteam} of
 * {@linkcode Uint8Array}s to an object. Works the same as
 * {@linkcode Request.json} and {@linkcode Response.json}.
 *
 * @param readableStream A `ReadableStream` whose chunks compose a JSON.
 * @returns A promise that resolves to the parsed JSON.
 *
 * @example Basic usage
 * ```ts
 * import { toJson } from "@std/streams/to-json";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const stream = ReadableStream.from([
 *   "[1, true",
 *   ', [], {}, "hello',
 *   '", null]',
 * ]).pipeThrough(new TextEncoderStream());
 * const json = await toJson(stream);
 * assertEquals(json, [1, true, [], {}, "hello", null]);
 * ```
 */
export function toJson(
  readableStream: ReadableStream<Uint8Array>,
): Promise<unknown> {
  return toText(readableStream).then(JSON.parse);
}
