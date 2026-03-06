// Copyright 2018-2026 the Deno authors. MIT license.

import type { ReleaseLock } from "./_common.ts";
import type { CborStreamOutput } from "./types.ts";

/**
 * A {@link ReadableStream} that wraps the decoded CBOR "Array".
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
 *   CborArrayDecodedStream,
 *   CborArrayEncoderStream,
 *   CborSequenceDecoderStream,
 * } from "@std/cbor";
 *
 * const rawMessage = ["a".repeat(100), "b".repeat(100), "c".repeat(100)];
 *
 * for await (
 *   const value of ReadableStream.from(rawMessage)
 *     .pipeThrough(new CborArrayEncoderStream())
 *     .pipeThrough(new CborSequenceDecoderStream())
 * ) {
 *   assert(value instanceof CborArrayDecodedStream);
 *   let i = 0;
 *   for await (const text of value) {
 *     assert(typeof text === "string");
 *     assertEquals(text, rawMessage[i++]);
 *   }
 * }
 * ```
 */
export class CborArrayDecodedStream extends ReadableStream<CborStreamOutput> {
  /**
   * Constructs a new instance.
   *
   * @param gen A {@link AsyncGenerator<CborStreamOutput>}.
   * @param releaseLock A Function that's called when the stream is finished.
   */
  constructor(gen: AsyncGenerator<CborStreamOutput>, releaseLock: ReleaseLock) {
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
