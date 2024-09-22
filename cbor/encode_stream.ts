// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { numberToArray, upgradeStreamFromGen } from "./_common.ts";
import { type CborPrimitiveType, CborTag, encodeCbor } from "./encode.ts";

/**
 * Specifies the encodable value types for the {@link CborSequenceEncoderStream}
 * and {@link CborArrayEncoderStream}.
 */
export type CborInputStream =
  | CborPrimitiveType
  | CborTag<CborInputStream>
  | CborInputStream[]
  | { [k: string]: CborInputStream }
  | CborByteEncoderStream
  | CborTextEncoderStream
  | CborArrayEncoderStream
  | CborMapEncoderStream;

/**
 * Specifies the structure of input for the {@link CborMapEncoderStream}.
 */
export type CborMapInputStream = [string, CborInputStream];

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
 * } from "./mod.ts";
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
    this.#readable = upgradeStreamFromGen(async function* () {
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
    }());
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
   * } from "./mod.ts";
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
   * } from "./mod.ts";
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
   * } from "./mod.ts";
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
 * } from "./mod.ts";
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
    this.#readable = upgradeStreamFromGen(async function* () {
      yield new Uint8Array([0b011_11111]);
      for await (const x of readable.pipeThrough(new TextEncoderStream())) {
        if (x.length < 24) yield new Uint8Array([0b011_00000 + x.length]);
        else if (x.length < 2 ** 8) {
          yield new Uint8Array([0b011_11000, x.length]);
        } else if (x.length < 2 ** 16) {
          yield new Uint8Array([0b011_11001, ...numberToArray(2, x.length)]);
        } else if (x.length < 2 ** 32) {
          yield new Uint8Array([0b011_11010, ...numberToArray(4, x.length)]);
        } // Can safely assume `x.length < 2 ** 64` as JavaScript doesn't support a `Uint8Array` being that large.
        else yield new Uint8Array([0b011_11011, ...numberToArray(8, x.length)]);
        yield x;
      }
      yield new Uint8Array([0b111_11111]);
    }());
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
   * } from "./mod.ts";
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
   * } from "./mod.ts";
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
   * } from "./mod.ts";
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
 * } from "./mod.ts";
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
   * } from "./mod.ts";
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
   * } from "./mod.ts";
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
   * } from "./mod.ts";
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
 * } from "./mod.ts";
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
    this.#readable = upgradeStreamFromGen(async function* () {
      yield new Uint8Array([0b101_11111]);
      for await (const [k, v] of readable) {
        yield encodeCbor(k);
        for await (const x of CborSequenceEncoderStream.from([v]).readable) {
          yield x;
        }
      }
      yield new Uint8Array([0b111_11111]);
    }());
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
   * } from "./mod.ts";
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
   * } from "./mod.ts";
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
   * } from "./mod.ts";
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

/**
 * A {@link TransformStream} that encodes a
 * {@link ReadableStream<CborInputStream>} into CBOR format sequence.
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * @example Usage
 * ```ts no-assert
 * import { encodeBase64Url } from "@std/encoding";
 * import {
 *   CborArrayDecodedStream,
 *   CborArrayEncoderStream,
 *   CborByteDecodedStream,
 *   CborByteEncoderStream,
 *   CborMapDecodedStream,
 *   CborMapEncoderStream,
 *   type CborOutputStream,
 *   CborSequenceDecoderStream,
 *   CborSequenceEncoderStream,
 *   CborTag,
 *   CborTextDecodedStream,
 *   CborTextEncoderStream,
 * } from "./mod.ts";
 *
 * const rawMessage = [
 *   undefined,
 *   null,
 *   true,
 *   false,
 *   3.14,
 *   5,
 *   2n ** 32n,
 *   "Hello World",
 *   new Uint8Array(25),
 *   new Date(),
 *   new CborTag(33, encodeBase64Url(new Uint8Array(7))),
 *   ["cake", "carrot"],
 *   { a: 3, b: "d" },
 *   CborByteEncoderStream.from([new Uint8Array(7)]),
 *   CborTextEncoderStream.from(["Bye!"]),
 *   CborArrayEncoderStream.from([
 *     "Hey!",
 *     CborByteEncoderStream.from([new Uint8Array(18)]),
 *   ]),
 *   CborMapEncoderStream.from([
 *     ["a", 0],
 *     ["b", "potato"],
 *   ]),
 * ];
 *
 * async function logValue(value: CborOutputStream) {
 *   if (
 *     value instanceof CborByteDecodedStream ||
 *     value instanceof CborTextDecodedStream
 *   ) {
 *     for await (const x of value) console.log(x);
 *   } else if (value instanceof CborArrayDecodedStream) {
 *     for await (const x of value) logValue(x);
 *   } else if (value instanceof CborMapDecodedStream) {
 *     for await (const [k, v] of value) {
 *       console.log(k);
 *       logValue(v);
 *     }
 *   } else if (value instanceof CborTag) {
 *     console.log(value);
 *     logValue(value.tagContent);
 *   } else console.log(value);
 * }
 *
 * for await (
 *   const value of ReadableStream.from(rawMessage)
 *     .pipeThrough(new CborSequenceEncoderStream())
 *     .pipeThrough(new CborSequenceDecoderStream())
 * ) {
 *   logValue(value);
 * }
 * ```
 */
export class CborSequenceEncoderStream
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
    this.#readable = upgradeStreamFromGen(this.#encodeFromReadable(readable));
    this.#writable = writable;
  }

  async *#encodeFromReadable(
    readable: ReadableStream<CborInputStream>,
  ): AsyncGenerator<Uint8Array> {
    for await (const x of readable) {
      for await (const y of this.#encode(x)) {
        yield y;
      }
    }
  }

  async *#encode(
    x: CborInputStream,
  ): AsyncGenerator<Uint8Array> {
    if (
      x instanceof CborByteEncoderStream ||
      x instanceof CborTextEncoderStream ||
      x instanceof CborArrayEncoderStream ||
      x instanceof CborMapEncoderStream
    ) {
      for await (const y of x.readable) {
        yield y;
      }
    } else if (x instanceof Array) {
      for await (const y of this.#encodeArray(x)) {
        yield y;
      }
    } else if (x instanceof CborTag) {
      for await (const y of this.#encodeTag(x)) {
        yield y;
      }
    } else if (typeof x === "object" && x !== null) {
      if (x instanceof Date || x instanceof Uint8Array) yield encodeCbor(x);
      else {
        for await (const y of this.#encodeObject(x)) {
          yield y;
        }
      }
    } else yield encodeCbor(x);
  }

  async *#encodeArray(x: CborInputStream[]): AsyncGenerator<Uint8Array> {
    if (x.length < 24) yield new Uint8Array([0b100_00000 + x.length]);
    else if (x.length < 2 ** 8) yield new Uint8Array([0b100_11000, x.length]);
    else if (x.length < 2 ** 16) {
      yield new Uint8Array([0b100_11001, ...numberToArray(2, x.length)]);
    } else if (x.length < 2 ** 32) {
      yield new Uint8Array([0b100_11010, ...numberToArray(4, x.length)]);
    } // Can safely assume `x.length < 2 ** 64` as JavaScript doesn't support an `Array` being that large.
    else yield new Uint8Array([0b100_11011, ...numberToArray(8, x.length)]);
    for (const y of x) {
      for await (const z of this.#encode(y)) {
        yield z;
      }
    }
  }

  async *#encodeObject(
    x: { [k: string]: CborInputStream },
  ): AsyncGenerator<Uint8Array> {
    const len = Object.keys(x).length;
    if (len < 24) yield new Uint8Array([0b101_00000 + len]);
    else if (len < 2 ** 8) yield new Uint8Array([0b101_11000, len]);
    else if (len < 2 ** 16) {
      yield new Uint8Array([0b101_11001, ...numberToArray(2, len)]);
    } else if (len < 2 ** 32) {
      yield new Uint8Array([0b101_11010, ...numberToArray(4, len)]);
    } // Can safely assume `len < 2 ** 64` as JavaScript doesn't support an `Object` being that Large.
    else yield new Uint8Array([0b101_11011, ...numberToArray(8, len)]);
    for (const [k, v] of Object.entries(x)) {
      yield encodeCbor(k);
      for await (const y of this.#encode(v)) {
        yield y;
      }
    }
  }

  async *#encodeTag(x: CborTag<CborInputStream>): AsyncGenerator<Uint8Array> {
    const tagNumber = BigInt(x.tagNumber);
    if (tagNumber < 0n) {
      throw new RangeError(
        `Cannot encode Tag Item: Tag Number (${x.tagNumber}) is less than zero`,
      );
    }
    if (tagNumber > 2n ** 64n) {
      throw new RangeError(
        `Cannot encode Tag Item: Tag Number (${x.tagNumber}) exceeds 2 ** 64 - 1`,
      );
    }

    const head = encodeCbor(tagNumber);
    head[0]! += 0b110_00000;
    yield head;
    for await (const y of this.#encode(x.tagContent)) {
      yield y;
    }
  }

  /**
   * Creates a {@link CborSequenceEncoderStream} instance from an iterable of
   * {@link CborInputStream} chunks.
   *
   * @example Usage
   * ```ts no-assert
   * import { encodeBase64Url } from "@std/encoding";
   * import {
   *   CborArrayDecodedStream,
   *   CborArrayEncoderStream,
   *   CborByteDecodedStream,
   *   CborByteEncoderStream,
   *   CborMapDecodedStream,
   *   CborMapEncoderStream,
   *   type CborOutputStream,
   *   CborSequenceDecoderStream,
   *   CborSequenceEncoderStream,
   *   CborTag,
   *   CborTextDecodedStream,
   *   CborTextEncoderStream,
   * } from "./mod.ts";
   *
   * const rawMessage = [
   *   undefined,
   *   null,
   *   true,
   *   false,
   *   3.14,
   *   5,
   *   2n ** 32n,
   *   "Hello World",
   *   new Uint8Array(25),
   *   new Date(),
   *   new CborTag(33, encodeBase64Url(new Uint8Array(7))),
   *   ["cake", "carrot"],
   *   { a: 3, b: "d" },
   *   CborByteEncoderStream.from([new Uint8Array(7)]),
   *   CborTextEncoderStream.from(["Bye!"]),
   *   CborArrayEncoderStream.from([
   *     "Hey!",
   *     CborByteEncoderStream.from([new Uint8Array(18)]),
   *   ]),
   *   CborMapEncoderStream.from([
   *     ["a", 0],
   *     ["b", "potato"],
   *   ]),
   * ];
   *
   * async function logValue(value: CborOutputStream) {
   *   if (
   *     value instanceof CborByteDecodedStream ||
   *     value instanceof CborTextDecodedStream
   *   ) {
   *     for await (const x of value) console.log(x);
   *   } else if (value instanceof CborArrayDecodedStream) {
   *     for await (const x of value) logValue(x);
   *   } else if (value instanceof CborMapDecodedStream) {
   *     for await (const [k, v] of value) {
   *       console.log(k);
   *       logValue(v);
   *     }
   *   } else if (value instanceof CborTag) {
   *     console.log(value);
   *     logValue(value.tagContent);
   *   } else console.log(value);
   * }
   *
   * for await (
   *   const value of CborSequenceEncoderStream.from(rawMessage)
   *     .readable
   *     .pipeThrough(new CborSequenceDecoderStream())
   * ) {
   *   logValue(value);
   * }
   * ```
   *
   * @param asyncIterable The value to encode of type
   * {@link AsyncIterable<CborInputStream>} or
   * {@link Iterable<CborInputStream>}.
   * @returns A {@link CborSequenceEncoderStream} instance of the encoded data.
   */
  static from(
    asyncIterable: AsyncIterable<CborInputStream> | Iterable<CborInputStream>,
  ): CborSequenceEncoderStream {
    const encoder = new CborSequenceEncoderStream();
    ReadableStream.from(asyncIterable).pipeTo(encoder.writable);
    return encoder;
  }

  /**
   * The {@link ReadableStream<Uint8Array>} associated with the instance, which
   * provides the encoded CBOR data as {@link Uint8Array} chunks.
   *
   * @example Usage
   * ```ts no-assert
   * import { encodeBase64Url } from "@std/encoding";
   * import {
   *   CborArrayDecodedStream,
   *   CborArrayEncoderStream,
   *   CborByteDecodedStream,
   *   CborByteEncoderStream,
   *   CborMapDecodedStream,
   *   CborMapEncoderStream,
   *   type CborOutputStream,
   *   CborSequenceDecoderStream,
   *   CborSequenceEncoderStream,
   *   CborTag,
   *   CborTextDecodedStream,
   *   CborTextEncoderStream,
   * } from "./mod.ts";
   *
   * const rawMessage = [
   *   undefined,
   *   null,
   *   true,
   *   false,
   *   3.14,
   *   5,
   *   2n ** 32n,
   *   "Hello World",
   *   new Uint8Array(25),
   *   new Date(),
   *   new CborTag(33, encodeBase64Url(new Uint8Array(7))),
   *   ["cake", "carrot"],
   *   { a: 3, b: "d" },
   *   CborByteEncoderStream.from([new Uint8Array(7)]),
   *   CborTextEncoderStream.from(["Bye!"]),
   *   CborArrayEncoderStream.from([
   *     "Hey!",
   *     CborByteEncoderStream.from([new Uint8Array(18)]),
   *   ]),
   *   CborMapEncoderStream.from([
   *     ["a", 0],
   *     ["b", "potato"],
   *   ]),
   * ];
   *
   * async function logValue(value: CborOutputStream) {
   *   if (
   *     value instanceof CborByteDecodedStream ||
   *     value instanceof CborTextDecodedStream
   *   ) {
   *     for await (const x of value) console.log(x);
   *   } else if (value instanceof CborArrayDecodedStream) {
   *     for await (const x of value) logValue(x);
   *   } else if (value instanceof CborMapDecodedStream) {
   *     for await (const [k, v] of value) {
   *       console.log(k);
   *       logValue(v);
   *     }
   *   } else if (value instanceof CborTag) {
   *     console.log(value);
   *     logValue(value.tagContent);
   *   } else console.log(value);
   * }
   *
   * for await (
   *   const value of ReadableStream.from(rawMessage)
   *     .pipeThrough(new CborSequenceEncoderStream())
   *     .pipeThrough(new CborSequenceDecoderStream())
   * ) {
   *   logValue(value);
   * }
   * ```
   *
   * @returns A {@link ReadableStream<Uint8Array>}.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The {@link WritableStream<CborInputStream>} associated with the
   * instance, which accepts {@link CborInputStream} chunks to be encoded
   * into CBOR format.
   *
   * @example Usage
   * ```ts no-assert
   * import { encodeBase64Url } from "@std/encoding";
   * import {
   *   CborArrayDecodedStream,
   *   CborArrayEncoderStream,
   *   CborByteDecodedStream,
   *   CborByteEncoderStream,
   *   CborMapDecodedStream,
   *   CborMapEncoderStream,
   *   type CborOutputStream,
   *   CborSequenceDecoderStream,
   *   CborSequenceEncoderStream,
   *   CborTag,
   *   CborTextDecodedStream,
   *   CborTextEncoderStream,
   * } from "./mod.ts";
   *
   * const rawMessage = [
   *   undefined,
   *   null,
   *   true,
   *   false,
   *   3.14,
   *   5,
   *   2n ** 32n,
   *   "Hello World",
   *   new Uint8Array(25),
   *   new Date(),
   *   new CborTag(33, encodeBase64Url(new Uint8Array(7))),
   *   ["cake", "carrot"],
   *   { a: 3, b: "d" },
   *   CborByteEncoderStream.from([new Uint8Array(7)]),
   *   CborTextEncoderStream.from(["Bye!"]),
   *   CborArrayEncoderStream.from([
   *     "Hey!",
   *     CborByteEncoderStream.from([new Uint8Array(18)]),
   *   ]),
   *   CborMapEncoderStream.from([
   *     ["a", 0],
   *     ["b", "potato"],
   *   ]),
   * ];
   *
   * async function logValue(value: CborOutputStream) {
   *   if (
   *     value instanceof CborByteDecodedStream ||
   *     value instanceof CborTextDecodedStream
   *   ) {
   *     for await (const x of value) console.log(x);
   *   } else if (value instanceof CborArrayDecodedStream) {
   *     for await (const x of value) logValue(x);
   *   } else if (value instanceof CborMapDecodedStream) {
   *     for await (const [k, v] of value) {
   *       console.log(k);
   *       logValue(v);
   *     }
   *   } else if (value instanceof CborTag) {
   *     console.log(value);
   *     logValue(value.tagContent);
   *   } else console.log(value);
   * }
   *
   * for await (
   *   const value of ReadableStream.from(rawMessage)
   *     .pipeThrough(new CborSequenceEncoderStream())
   *     .pipeThrough(new CborSequenceDecoderStream())
   * ) {
   *   logValue(value);
   * }
   * ```
   *
   * @returns A {@link WritableStream<CborInputStream>}.
   */
  get writable(): WritableStream<CborInputStream> {
    return this.#writable;
  }
}
