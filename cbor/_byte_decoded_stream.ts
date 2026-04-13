// Copyright 2018-2026 the Deno authors. MIT license.

import type { ReleaseLock } from "./_common.ts";

/**
 * A {@link ReadableStream} that wraps the decoded CBOR "Byte String".
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * Instances of this class is created from {@link CborSequenceDecoderStream}.
 * This class is not designed for you to create instances of it yourself. It is
 * merely a way for you to validate the type being returned.
 *
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { concat } from "@std/bytes";
 * import {
 *   CborByteDecodedStream,
 *   CborByteEncoderStream,
 *   CborSequenceDecoderStream,
 * } from "@std/cbor";
 *
 * const rawMessage = new Uint8Array(100);
 *
 * for await (
 *   const value of ReadableStream.from([rawMessage])
 *     .pipeThrough(new CborByteEncoderStream())
 *     .pipeThrough(new CborSequenceDecoderStream())
 * ) {
 *   assert(value instanceof Uint8Array || value instanceof CborByteDecodedStream);
 *   if (value instanceof CborByteDecodedStream) {
 *     assertEquals(concat(await Array.fromAsync(value)), new Uint8Array(100));
 *   } else assertEquals(value, new Uint8Array(100));
 * }
 * ```
 */
export class CborByteDecodedStream extends ReadableStream<Uint8Array> {
  /**
   * Constructs a new instance.
   *
   * @param gen A {@link AsyncGenerator<Uint8Array>}.
   * @param releaseLock A Function that's called when the stream is finished.
   */
  constructor(gen: AsyncGenerator<Uint8Array>, releaseLock: ReleaseLock) {
    super({
      async pull(controller) {
        const { done, value } = await gen.next();
        if (done) {
          releaseLock();
          controller.close();
        } else controller.enqueue(value);
      },
      async cancel() {
        // deno-lint-ignore no-empty
        for await (const _ of gen) {}
        releaseLock();
      },
    });
  }
}
