// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { toByteStream } from "./_common.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborSequenceEncoderStream } from "./sequence_encoder_stream.ts";
import type { CborMapInputStream } from "./types.ts";

/**
 * A {@link TransformStream} that encodes a
 * {@link ReadableStream<CborMapInputStream>} into CBOR "Indefinite Length Map".
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
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
export class CborMapEncoderStream
  implements TransformStream<CborMapInputStream, Uint8Array> {
  #readable: ReadableStream<Uint8Array>;
  #writable: WritableStream<CborMapInputStream>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      CborMapInputStream,
      CborMapInputStream
    >();
    this.#readable = toByteStream(ReadableStream.from(async function* () {
      yield new Uint8Array([0b101_11111]);
      for await (const [k, v] of readable) {
        yield encodeCbor(k);
        for await (const x of CborSequenceEncoderStream.from([v]).readable) {
          yield x;
        }
      }
      yield new Uint8Array([0b111_11111]);
    }()));
    this.#writable = writable;
  }

  /**
   * Creates a {@link CborMapEncoderStream} instance from an iterable of
   * {@link CborMapInputStream} chunks.
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
   *   const value of CborMapEncoderStream.from(Object.entries(rawMessage))
   *     .readable
   *     .pipeThrough(new CborSequenceDecoderStream())
   * ) {
   *   assert(value instanceof CborMapDecodedStream);
   *   for await (const [k, v] of value) {
   *     assertEquals(rawMessage[k], v);
   *   }
   * }
   * ```
   *
   * @param asyncIterable The value to encode of type
   * {@link AsyncIterable<CborMapInputStream>} or
   * {@link Iterable<CborMapInputStream>}.
   * @returns A {@link CborMapEncoderStream} instance of the encoded data.
   */
  static from(
    asyncIterable:
      | AsyncIterable<CborMapInputStream>
      | Iterable<CborMapInputStream>,
  ): CborMapEncoderStream {
    const encoder = new CborMapEncoderStream();
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
   *
   * @returns A {@link ReadableStream<Uint8Array>}.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The {@link WritableStream<CborMapInputStream>} associated with the
   * instance, which accepts {@link CborMapInputStream} chunks to be encoded
   * into CBOR format.
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
   *
   * @returns A {@link WritableStream<CborMapInputStream>}.
   */
  get writable(): WritableStream<CborMapInputStream> {
    return this.#writable;
  }
}
