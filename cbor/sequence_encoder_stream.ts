// Copyright 2018-2026 the Deno authors. MIT license.

import { toByteStream } from "@std/streams/unstable-to-byte-stream";
import { numberToArray } from "./_common.ts";
import { CborArrayEncoderStream } from "./array_encoder_stream.ts";
import { CborByteEncoderStream } from "./byte_encoder_stream.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborMapEncoderStream } from "./map_encoder_stream.ts";
import { CborTag } from "./tag.ts";
import { CborTextEncoderStream } from "./text_encoder_stream.ts";
import type { CborStreamInput } from "./types.ts";

/**
 * A {@link TransformStream} that encodes a
 * {@link ReadableStream<CborStreamInput>} into CBOR format sequence.
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
 *   type CborStreamOutput,
 *   CborSequenceDecoderStream,
 *   CborSequenceEncoderStream,
 *   CborTag,
 *   CborTextDecodedStream,
 *   CborTextEncoderStream,
 * } from "@std/cbor";
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
 * async function logValue(value: CborStreamOutput) {
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
  implements TransformStream<CborStreamInput, Uint8Array> {
  #readable: ReadableStream<Uint8Array>;
  #writable: WritableStream<CborStreamInput>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      CborStreamInput,
      CborStreamInput
    >();
    this.#readable = toByteStream(
      ReadableStream.from(this.#encodeFromReadable(readable)),
    );
    this.#writable = writable;
  }

  async *#encodeFromReadable(
    readable: ReadableStream<CborStreamInput>,
  ): AsyncGenerator<Uint8Array> {
    for await (const x of readable) {
      for await (const y of this.#encode(x)) {
        yield y;
      }
    }
  }

  async *#encode(
    x: CborStreamInput,
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

  async *#encodeArray(x: CborStreamInput[]): AsyncGenerator<Uint8Array> {
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
    x: { [k: string]: CborStreamInput },
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

  async *#encodeTag(x: CborTag<CborStreamInput>): AsyncGenerator<Uint8Array> {
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
   * {@link CborStreamInput} chunks.
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
   *   type CborStreamOutput,
   *   CborSequenceDecoderStream,
   *   CborSequenceEncoderStream,
   *   CborTag,
   *   CborTextDecodedStream,
   *   CborTextEncoderStream,
   * } from "@std/cbor";
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
   * async function logValue(value: CborStreamOutput) {
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
   * {@link AsyncIterable<CborStreamInput>} or
   * {@link Iterable<CborStreamInput>}.
   * @returns A {@link CborSequenceEncoderStream} instance of the encoded data.
   */
  static from(
    asyncIterable: AsyncIterable<CborStreamInput> | Iterable<CborStreamInput>,
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
   *   type CborStreamOutput,
   *   CborSequenceDecoderStream,
   *   CborSequenceEncoderStream,
   *   CborTag,
   *   CborTextDecodedStream,
   *   CborTextEncoderStream,
   * } from "@std/cbor";
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
   * async function logValue(value: CborStreamOutput) {
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
   * The {@link WritableStream<CborStreamInput>} associated with the
   * instance, which accepts {@link CborStreamInput} chunks to be encoded
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
   *   type CborStreamOutput,
   *   CborSequenceDecoderStream,
   *   CborSequenceEncoderStream,
   *   CborTag,
   *   CborTextDecodedStream,
   *   CborTextEncoderStream,
   * } from "@std/cbor";
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
   * async function logValue(value: CborStreamOutput) {
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
   * @returns A {@link WritableStream<CborStreamInput>}.
   */
  get writable(): WritableStream<CborStreamInput> {
    return this.#writable;
  }
}
