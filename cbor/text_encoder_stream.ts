// Copyright 2018-2026 the Deno authors. MIT license.

import { toByteStream } from "@std/streams/unstable-to-byte-stream";
import { numberToArray } from "./_common.ts";

/**
 * A {@link TransformStream} that encodes a {@link ReadableStream<string>} into
 * CBOR "Indefinite Length Text String".
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * **Notice:** Each chunk of the {@link ReadableStream<string>} is encoded as
 * its own "Definite Length Text String" meaning space can be saved if large
 * chunks are pipped through instead of small chunks.
 *
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import {
 *   CborSequenceDecoderStream,
 *   CborTextDecodedStream,
 *   CborTextEncoderStream,
 * } from "@std/cbor";
 *
 * const rawMessage = "a".repeat(100);
 *
 * for await (
 *   const value of ReadableStream.from([rawMessage])
 *     .pipeThrough(new CborTextEncoderStream())
 *     .pipeThrough(new CborSequenceDecoderStream())
 * ) {
 *   assert(typeof value === "string" || value instanceof CborTextDecodedStream);
 *   if (value instanceof CborTextDecodedStream) {
 *     assertEquals((await Array.fromAsync(value)).join(""), rawMessage);
 *   } else assertEquals(value, rawMessage);
 * }
 * ```
 */
export class CborTextEncoderStream
  implements TransformStream<string, Uint8Array> {
  #readable: ReadableStream<Uint8Array>;
  #writable: WritableStream<string>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<string, string>();
    this.#readable = toByteStream(ReadableStream.from(async function* () {
      yield new Uint8Array([0b011_11111]);
      const textEncoder = new TextEncoder();
      for await (const x of readable) {
        const y = textEncoder.encode(x);
        if (y.length < 24) yield new Uint8Array([0b011_00000 + y.length]);
        else if (y.length < 2 ** 8) {
          yield new Uint8Array([0b011_11000, y.length]);
        } else if (y.length < 2 ** 16) {
          yield new Uint8Array([0b011_11001, ...numberToArray(2, y.length)]);
        } else if (y.length < 2 ** 32) {
          yield new Uint8Array([0b011_11010, ...numberToArray(4, y.length)]);
        } // Can safely assume `x.length < 2 ** 64` as JavaScript doesn't support a `Uint8Array` being that large.
        else yield new Uint8Array([0b011_11011, ...numberToArray(8, y.length)]);
        yield y;
      }
      yield new Uint8Array([0b111_11111]);
    }()));
    this.#writable = writable;
  }

  /**
   * Creates a {@link CborTextEncoderStream} instance from an iterable of
   * {@link string} chunks.
   *
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import {
   *   CborSequenceDecoderStream,
   *   CborTextDecodedStream,
   *   CborTextEncoderStream,
   * } from "@std/cbor";
   *
   * const rawMessage = "a".repeat(100);
   *
   * for await (
   *   const value of CborTextEncoderStream.from([rawMessage])
   *     .readable
   *     .pipeThrough(new CborSequenceDecoderStream())
   * ) {
   *   assert(typeof value === "string" || value instanceof CborTextDecodedStream);
   *   if (value instanceof CborTextDecodedStream) {
   *     assertEquals((await Array.fromAsync(value)).join(""), rawMessage);
   *   } else assertEquals(value, rawMessage);
   * }
   * ```
   *
   * @param asyncIterable The value to encode of type
   * {@link AsyncIterable<string>} or {@link Iterable<string>}
   * @returns A {@link CborTextEncoderStream} instance of the encoded data.
   */
  static from(
    asyncIterable: AsyncIterable<string> | Iterable<string>,
  ): CborTextEncoderStream {
    const encoder = new CborTextEncoderStream();
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
   *   CborSequenceDecoderStream,
   *   CborTextDecodedStream,
   *   CborTextEncoderStream,
   * } from "@std/cbor";
   *
   * const rawMessage = "a".repeat(100);
   *
   * for await (
   *   const value of ReadableStream.from([rawMessage])
   *     .pipeThrough(new CborTextEncoderStream())
   *     .pipeThrough(new CborSequenceDecoderStream())
   * ) {
   *   assert(typeof value === "string" || value instanceof CborTextDecodedStream);
   *   if (value instanceof CborTextDecodedStream) {
   *     assertEquals((await Array.fromAsync(value)).join(""), rawMessage);
   *   } else assertEquals(value, rawMessage);
   * }
   * ```
   *
   * @returns A {@link ReadableStream<Uint8Array>}.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The {@link WritableStream<string>} associated with the instance, which
   * accepts {@link string} chunks to be encoded into CBOR format.
   *
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import {
   *   CborSequenceDecoderStream,
   *   CborTextDecodedStream,
   *   CborTextEncoderStream,
   * } from "@std/cbor";
   *
   * const rawMessage = "a".repeat(100);
   *
   * for await (
   *   const value of ReadableStream.from([rawMessage])
   *     .pipeThrough(new CborTextEncoderStream())
   *     .pipeThrough(new CborSequenceDecoderStream())
   * ) {
   *   assert(typeof value === "string" || value instanceof CborTextDecodedStream);
   *   if (value instanceof CborTextDecodedStream) {
   *     assertEquals((await Array.fromAsync(value)).join(""), rawMessage);
   *   } else assertEquals(value, rawMessage);
   * }
   * ```
   *
   * @returns A {@link WritableStream<string>}.
   */
  get writable(): WritableStream<string> {
    return this.#writable;
  }
}
