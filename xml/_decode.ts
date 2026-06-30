// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Internal helper for decoding an async iterable of bytes into XML text
 * chunks, used by the `*FromBytes` streaming APIs.
 *
 * @module
 */

/**
 * Decodes an {@linkcode AsyncIterable} of `Uint8Array` chunks into XML text
 * chunks using a streaming {@linkcode TextDecoder}. Any trailing bytes left
 * in the decoder are flushed before the generator returns.
 *
 * @param source The async iterable of byte chunks.
 * @returns An async generator yielding decoded text chunks.
 */
export async function* decodeAsyncIterable(
  source: AsyncIterable<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  for await (const chunk of source) {
    yield decoder.decode(chunk, { stream: true });
  }
  const final = decoder.decode();
  if (final) yield final;
}
