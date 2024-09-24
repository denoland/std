// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { upgradeStreamFromGen } from "./_common.ts";
import { CborSequenceEncoderStream } from "./sequence_encoder_stream.ts";
import type { CborInputStream } from "./types.ts";

/**
 * A {@link TransformStream} that encodes a
 * {@link ReadableStream<CborInputStream>} into CBOR "Indefinite Length Array".
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
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
export class CborArrayEncoderStream
  implements TransformStream<CborInputStream, Uint8Array> {
  #readable: ReadableStream<Uint8Array>;
  #writable: WritableStream<CborInputStream>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      CborInputStream,
      CborInputStream
    >();
    this.#readable = upgradeStreamFromGen(async function* () {
      yield new Uint8Array([0b100_11111]);
      for await (
        const x of readable.pipeThrough(new CborSequenceEncoderStream())
      ) {
        yield x;
      }
      yield new Uint8Array([0b111_11111]);
    }());
    this.#writable = writable;
  }

  /**
   * Creates a {@link CborArrayEncoderStream} instance from an iterable of
   * {@link CborInputStream} chunks.
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
   *   const value of CborArrayEncoderStream.from(rawMessage)
   *     .readable
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
   *
   * @param asyncIterable The value to encode of type
   * {@link AsyncIterable<CborInputStream>} or
   * {@link Iterable<CborInputStream>}.
   * @returns A {@link CborArrayEncoderStream} instance of the encoded data.
   */
  static from(
    asyncIterable: AsyncIterable<CborInputStream> | Iterable<CborInputStream>,
  ): CborArrayEncoderStream {
    const encoder = new CborArrayEncoderStream();
    ReadableStream.from(asyncIterable).pipeTo(encoder.writable);
    return encoder;
  }

  /**
   * The {@link ReadableStream<Uint8Array>} associated with the instance, which
   * provides the encoded CBOR data as {@link Uint8Array} chunks.
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
   *
   * @returns A {@link ReadableStream<Uint8Array>}.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The {@link WritableStream<CborInputStream>} associated with the instance,
   * which accepts {@link CborInputStream} chunks to be encoded into CBOR
   * format.
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
   *
   * @returns A {@link WritableStream<CborInputStream>}.
   */
  get writable(): WritableStream<CborInputStream> {
    return this.#writable;
  }
}
