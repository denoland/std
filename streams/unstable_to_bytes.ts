// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Converts a {@linkcode ReadableStream} of {@linkcode Uint8Array}s to a
 * {@linkcode Uint8Array}. Works the same as {@linkcode Response.bytes}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param stream A `ReadableStream` of `Uint8Array`s to convert into a `Uint8Array`.
 * @returns A `Promise` that resolves to the `Uint8Array`.
 *
 * @example Basic usage
 * ```ts
 * import { toBytes } from "@std/streams/unstable-to-bytes";
 * import { assertEquals } from "@std/assert";
 *
 * const stream = ReadableStream.from([
 *   new Uint8Array([1, 2]),
 *   new Uint8Array([3, 4, 5]),
 * ]);
 * const bytes = await toBytes(stream);
 * assertEquals(bytes, new Uint8Array([1, 2, 3, 4, 5]));
 * ```
 */
export function toBytes(
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> {
  return new Response(stream).bytes();
}
