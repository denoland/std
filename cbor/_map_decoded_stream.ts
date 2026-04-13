// Copyright 2018-2026 the Deno authors. MIT license.

import type { ReleaseLock } from "./_common.ts";
import type { CborMapStreamOutput } from "./types.ts";

/**
 * A {@link ReadableStream} that wraps the decoded CBOR "Map".
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * Instances of this class is created from {@link CborSequenceDecoderStream}.
 * This class is not designed for you to create instances of it yourself. It is
 * merely a way for you to validate the type being returned.
 *
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import {
 *   CborMapDecodedStream,
 *   CborMapEncoderStream,
 *   CborSequenceDecoderStream,
 * } from "@std/cbor";
 *
 * const rawMessage: Record<string, number> = {
 *   a: 0,
 *   b: 1,
 *   c: 2,
 *   d: 3,
 * };
 *
 * for await (
 *   const value of ReadableStream.from(Object.entries(rawMessage))
 *     .pipeThrough(new CborMapEncoderStream)
 *     .pipeThrough(new CborSequenceDecoderStream())
 * ) {
 *   assert(value instanceof CborMapDecodedStream);
 *   for await (const [k, v] of value) {
 *     assertEquals(rawMessage[k], v);
 *   }
 * }
 * ```
 */
export class CborMapDecodedStream extends ReadableStream<CborMapStreamOutput> {
  /**
   * Constructs a new instance.
   *
   * @param gen A {@link AsyncGenerator<CborMapStreamOutput>}.
   * @param releaseLock A Function that's called when the stream is finished.
   */
  constructor(
    gen: AsyncGenerator<CborMapStreamOutput>,
    releaseLock: ReleaseLock,
  ) {
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
