// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * Converts a {@linkcode ReadableStream} of strings or {@linkcode Uint8Array}s
 * to a {@linkcode Blob}. Works the same as {@linkcode Response.blob}.
 *
 * @example
 * ```ts
 * import { toBlob } from "https://deno.land/std@$STD_VERSION/streams/to_blob.ts";
 *
 * const stream = ReadableStream.from([new Uint8Array(1), new Uint8Array(2)]);
 * await toBlob(stream); // Blob { size: 3, type: "" }
 * ```
 */
export async function toBlob(
  readableStream: ReadableStream,
): Promise<Blob> {
  const reader = readableStream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    chunks.push(value);
  }

  return new Blob(chunks);
}
