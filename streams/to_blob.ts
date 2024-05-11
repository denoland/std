// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Converts a {@linkcode ReadableStream} of {@linkcode Uint8Array}s to a
 * {@linkcode Blob}. Works the same as {@linkcode Response.blob}.
 *
 * @example
 * ```ts
 * import { toBlob } from "@std/streams/to-blob";
 *
 * const stream = ReadableStream.from([new Uint8Array(1), new Uint8Array(2)]);
 * await toBlob(stream); // Blob { size: 3, type: "" }
 * ```
 */
export async function toBlob(
  stream: ReadableStream<Uint8Array>,
): Promise<Blob> {
  return await new Response(stream).blob();
}
