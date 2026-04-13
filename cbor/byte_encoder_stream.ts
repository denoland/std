// Copyright 2018-2026 the Deno authors. MIT license.

import { toByteStream } from "@std/streams/unstable-to-byte-stream";
import { numberToArray } from "./_common.ts";

/**
 * A {@link TransformStream} that encodes a {@link ReadableStream<Uint8Array>}
 * into CBOR "Indefinite Length Byte String".
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * **Notice:** Each chunk of the {@link ReadableStream<Uint8Array>} is encoded
 * as its own "Definite Length Byte String" meaning space can be saved if large
 * chunks are pipped through instead of small chunks.
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
export class CborByteEncoderStream
  implements TransformStream<Uint8Array, Uint8Array> {
  #readable: ReadableStream<Uint8Array>;
  #writable: WritableStream<Uint8Array>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    this.#readable = toByteStream(ReadableStream.from(async function* () {
      yield new Uint8Array([0b010_11111]);
      for await (const x of readable) {
        if (x.length < 24) yield new Uint8Array([0b010_00000 + x.length]);
        else if (x.length < 2 ** 8) {
          yield new Uint8Array([0b010_11000, x.length]);
        } else if (x.length < 2 ** 16) {
          yield new Uint8Array([0b010_11001, ...numberToArray(2, x.length)]);
        } else if (x.length < 2 ** 32) {
          yield new Uint8Array([0b010_11010, ...numberToArray(4, x.length)]);
        } // Can safely assume `x.length < 2 ** 64` as JavaScript doesn't support a `Uint8Array` being that large.
        else yield new Uint8Array([0b010_11011, ...numberToArray(8, x.length)]);
        yield x;
      }
      yield new Uint8Array([0b111_11111]);
    }()));
    this.#writable = writable;
  }

  /**
   * Creates a {@link CborByteEncoderStream} instance from an iterable of
   * {@link Uint8Array} chunks.
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
   *   const value of CborByteEncoderStream.from([rawMessage])
   *     .readable
   *     .pipeThrough(new CborSequenceDecoderStream())
   * ) {
   *   assert(value instanceof Uint8Array || value instanceof CborByteDecodedStream);
   *   if (value instanceof CborByteDecodedStream) {
   *     assertEquals(concat(await Array.fromAsync(value)), new Uint8Array(100));
   *   } else assertEquals(value, new Uint8Array(100));
   * }
   * ```
   *
   * @param asyncIterable The value to encode of type
   * {@link AsyncIterable<Uint8Array>} or {@link Iterable<Uint8Array>}.
   * @returns A {@link CborByteEncoderStream} instance of the encoded data.
   */
  static from(
    asyncIterable: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
  ): CborByteEncoderStream {
    const encoder = new CborByteEncoderStream();
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
   *
   * @returns A {@link ReadableStream<Uint8Array>}.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The {@link WritableStream<Uint8Array>} associated with the instance, which
   * accepts {@link Uint8Array} chunks to be encoded into CBOR format.
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
   *
   * @returns a {@link WritableStream<Uint8Array>}.
   */
  get writable(): WritableStream<Uint8Array> {
    return this.#writable;
  }
}
