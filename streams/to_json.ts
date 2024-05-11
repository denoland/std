// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { toText } from "./to_text.ts";

/**
 * Converts a JSON-formatted {@linkcode ReadableSteam} of strings or
 * {@linkcode Uint8Array}s to an object. Works the same as
 * {@linkcode Response.json}.
 *
 * @example
 * ```ts
 * import { toJson } from "@std/streams/to-json";
 *
 * const stream = ReadableStream.from([JSON.stringify({ hello: "world" })]);
 * await toJson(stream); // { hello: "world" }
 * ```
 */
export function toJson(
  readableStream: ReadableStream,
): Promise<unknown> {
  return toText(readableStream).then(JSON.parse);
}
