// Copyright 2018-2025 the Deno authors. MIT license.

import { toByteStream } from "@std/streams/unstable-to-byte-stream";
import { arrayToNumber, type ReleaseLock } from "./_common.ts";
import { CborArrayDecodedStream } from "./_array_decoded_stream.ts";
import { CborByteDecodedStream } from "./_byte_decoded_stream.ts";
import { CborMapDecodedStream } from "./_map_decoded_stream.ts";
import { CborTextDecodedStream } from "./_text_decoded_stream.ts";
import { CborTag } from "./tag.ts";
import type { CborMapStreamOutput, CborStreamOutput } from "./types.ts";

// deno-lint-ignore deno-std-docs/exported-symbol-documented
export {
  CborArrayDecodedStream,
  CborByteDecodedStream,
  CborMapDecodedStream,
  CborTextDecodedStream,
};

/**
 * A {@link TransformStream} that decodes a CBOR-sequence-encoded
 * {@link ReadableStream<Uint8Array>} into the JavaScript equivalent values
 * represented as {@link ReadableStream<CborStreamOutput>}.
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * **Limitations:**
 * - While CBOR does support map keys of any type, this implementation only
 * supports map keys being of type {@link string}, and will throw if detected
 * decoding otherwise.
 * - This decoder does not validate that the encoded data is free of duplicate
 * map keys, and will serve them all. This behaviour differentiates from
 * {@link decodeCbor} and {@link decodeCborSequence}.
 * - Arrays and Maps will always be decoded as a {@link CborArrayDecodedStream}
 * and {@link CborMapDecodedStream}, respectively.
 * - "Byte Strings" and "Text Strings" will be decoded as a
 * {@link CborByteDecodedStream} and {@link CborTextDecodedStream},
 * respectively, if they are encoded as an "Indefinite Length String" or their
 * "Definite Length" is 2 ** 32 and 2 ** 16, respectively, or greater.
 *
 * **Notice:**
 * - This decoder handles the tag numbers 0, and 1 automatically, all
 * others returned are wrapped in a {@link CborTag<CborStreamOutput>} instance.
 * - If a parent stream yields {@link CborByteDecodedStream},
 * {@link CborTextDecodedStream}, {@link CborArrayDecodedStream},
 * {@link CborMapDecodedStream}, or {@link CborTag} (with any of these types as
 * content), it will not resolve the next chunk until the yielded stream is
 * fully consumed or canceled.
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
export class CborSequenceDecoderStream
  implements TransformStream<Uint8Array, CborStreamOutput> {
  #source: ReadableStreamBYOBReader;
  #readable: ReadableStream<CborStreamOutput>;
  #writable: WritableStream<Uint8Array>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    this.#source = toByteStream(readable).getReader({ mode: "byob" });
    this.#readable = ReadableStream.from<CborStreamOutput>(
      this.#decodeSequence(),
    );
    this.#writable = writable;
  }

  async #read(bytes: number, expectMore: true): Promise<Uint8Array>;
  async #read(
    bytes: number,
    expectMore: false,
  ): Promise<Uint8Array | undefined>;
  async #read(
    bytes: number,
    expectMore: boolean,
  ): Promise<Uint8Array | undefined> {
    if (bytes === 0) return new Uint8Array(0);
    const { done, value } = await this.#source.read(new Uint8Array(bytes), {
      min: bytes,
    });
    if (done) {
      if (expectMore) throw new RangeError("More bytes were expected");
      else return undefined;
    }
    if (value.length < bytes) throw new RangeError("More bytes were expected");
    return value;
  }

  async *#readGen(bytes: bigint): AsyncGenerator<Uint8Array> {
    for (let i = 0n; i < bytes; i += 2n ** 16n) {
      yield await this.#read(Math.min(Number(bytes - i), 2 ** 16), true);
    }
  }

  async *#readDefinite(
    items: number | bigint,
  ): AsyncGenerator<CborStreamOutput> {
    items = BigInt(items);
    for (let i = 0n; i < items; ++i) {
      const x = await this.#decode(
        arrayToNumber((await this.#read(1, true)).buffer, true) as number,
      );
      if (x instanceof Array) {
        yield x[0];
        await x[1];
      } else yield x;
    }
  }

  async *#readIndefinite(
    denyInnerIndefinite: boolean,
    message?: string,
  ): AsyncGenerator<CborStreamOutput> {
    while (true) {
      const byte = arrayToNumber(
        (await this.#read(1, true)).buffer,
        true,
      ) as number;
      if (byte === 0b111_11111) break;
      if (denyInnerIndefinite && (byte & 0b000_11111) === 31) {
        throw new TypeError(message);
      }
      const x = await this.#decode(byte);
      if (x instanceof Array) {
        yield x[0];
        await x[1];
      } else yield x;
    }
  }

  async *#decodeSequence(): AsyncGenerator<CborStreamOutput> {
    while (true) {
      const value = await this.#read(1, false);
      if (value == undefined) return;
      // Since `value` is only 1 byte long, it will be of type `number`
      const x = await this.#decode(arrayToNumber(value.buffer, true) as number);
      if (x instanceof Array) {
        yield x[0];
        await x[1];
      } else yield x;
    }
  }

  #decode(
    byte: number,
  ): Promise<CborStreamOutput | [CborStreamOutput, lock: Promise<unknown>]> {
    const majorType = byte >> 5;
    const aI = byte & 0b000_11111;
    switch (majorType) {
      case 0:
        return this.#decodeZero(aI);
      case 1:
        return this.#decodeOne(aI);
      case 2:
        return this.#decodeTwo(aI);
      case 3:
        return this.#decodeThree(aI);
      case 4:
        return this.#decodeFour(aI);
      case 5:
        return this.#decodeFive(aI);
      case 6:
        return this.#decodeSix(aI);
      default:
        return this.#decodeSeven(aI);
    }
  }

  async #decodeZero(aI: number): Promise<number | bigint> {
    if (aI < 24) return aI;
    if (aI <= 27) {
      return arrayToNumber(
        (await this.#read(2 ** (aI - 24), true)).buffer,
        true,
      );
    }
    throw new RangeError(
      `Cannot decode value (0b000_${aI.toString(2).padStart(5, "0")})`,
    );
  }

  async #decodeOne(aI: number): Promise<number | bigint> {
    if (aI > 27) {
      throw new RangeError(
        `Cannot decode value (0b001_${aI.toString(2).padStart(5, "0")})`,
      );
    }
    const x = await this.#decodeZero(aI);
    return typeof x === "bigint" ? -x - 1n : -x - 1;
  }

  async #decodeTwo(
    aI: number,
  ): Promise<Uint8Array | [CborByteDecodedStream, lock: Promise<unknown>]> {
    if (aI < 24) return await this.#read(aI, true);
    if (aI <= 27) {
      const bytes = arrayToNumber(
        (await this.#read(2 ** (aI - 24), true)).buffer,
        true,
      );
      if (typeof bytes === "bigint") {
        let releaseLock: ReleaseLock = () => {};
        const lock = new Promise((x) => releaseLock = x);
        return [
          new CborByteDecodedStream(this.#readGen(bytes), releaseLock),
          lock,
        ];
      } else return await this.#read(bytes, true);
    }
    if (aI === 31) {
      let releaseLock: ReleaseLock = () => {};
      const lock = new Promise((x) => releaseLock = x);
      return [
        new CborByteDecodedStream(
          async function* (gen) {
            for await (const x of gen) {
              if (x instanceof Uint8Array) yield x;
              else if (x instanceof CborByteDecodedStream) {
                for await (const y of x) yield y;
              } else throw new TypeError("Unexpected type in CBOR byte string");
            }
          }(this.#readIndefinite(true, "")),
          releaseLock,
        ),
        lock,
      ];
    }
    throw new RangeError(
      `Cannot decode value (0b010_${aI.toString(2).padStart(5, "0")})`,
    );
  }

  async #decodeThree(
    aI: number,
  ): Promise<string | [CborTextDecodedStream, lock: Promise<unknown>]> {
    if (aI < 24) return new TextDecoder().decode(await this.#read(aI, true));
    if (aI <= 27) {
      const bytes = arrayToNumber(
        (await this.#read(2 ** (aI - 24), true)).buffer,
        true,
      );
      // Strings can't be as long as Uint8Arrays so a lower bound is set before switching to a stream.
      if (bytes > 2 ** 16) {
        let releaseLock: ReleaseLock = () => {};
        const lock = new Promise((x) => releaseLock = x);
        return [
          new CborTextDecodedStream(
            async function* (gen) {
              const decoder = new TextDecoder();
              for await (const chunk of gen) {
                yield decoder.decode(chunk, { stream: true });
              }
            }(this.#readGen(BigInt(bytes))),
            releaseLock,
          ),
          lock,
        ];
      } else {
        return new TextDecoder().decode(
          await this.#read(Number(bytes), true),
        );
      }
    }
    if (aI === 31) {
      let releaseLock: ReleaseLock = () => {};
      const lock = new Promise((x) => releaseLock = x);
      return [
        new CborTextDecodedStream(
          async function* (gen) {
            for await (const x of gen) {
              if (typeof x === "string") yield x;
              else if (x instanceof CborTextDecodedStream) {
                for await (const y of x) yield y;
              } else throw new TypeError("Unexpected type in CBOR text string");
            }
          }(this.#readIndefinite(true, "")),
          releaseLock,
        ),
        lock,
      ];
    }
    throw new RangeError(
      `Cannot decode value (0b011_${aI.toString(2).padStart(5, "0")})`,
    );
  }

  async #decodeFour(
    aI: number,
  ): Promise<[CborArrayDecodedStream, lock: Promise<unknown>]> {
    let releaseLock: ReleaseLock = () => {};
    const lock = new Promise((x) => releaseLock = x);
    if (aI < 24) {
      return [
        new CborArrayDecodedStream(this.#readDefinite(aI), releaseLock),
        lock,
      ];
    }
    if (aI <= 27) {
      return [
        new CborArrayDecodedStream(
          this.#readDefinite(
            arrayToNumber(
              (await this.#read(2 ** (aI - 24), true)).buffer,
              true,
            ),
          ),
          releaseLock,
        ),
        lock,
      ];
    }
    if (aI === 31) {
      return [
        new CborArrayDecodedStream(this.#readIndefinite(false), releaseLock),
        lock,
      ];
    }
    releaseLock();
    throw new RangeError(
      `Cannot decode value (0b100_${aI.toString(2).padStart(5, "0")})`,
    );
  }

  async #decodeFive(
    aI: number,
  ): Promise<[CborMapDecodedStream, lock: Promise<unknown>]> {
    async function* convert(
      gen: AsyncGenerator<CborStreamOutput>,
    ): AsyncGenerator<CborMapStreamOutput> {
      while (true) {
        const key = await gen.next();
        if (key.done) break;
        if (typeof key.value !== "string") {
          throw new TypeError(
            "Cannot parse map key: Only text string map keys are supported",
          );
        }

        const value = await gen.next();
        if (value.done) {
          throw new RangeError(
            "Impossible State: readDefinite | readIndefinite should have thrown an error",
          );
        }

        yield [key.value, value.value];
      }
    }

    let releaseLock: ReleaseLock = () => {};
    const lock = new Promise((x) => releaseLock = x);
    if (aI < 24) {
      return [
        new CborMapDecodedStream(
          convert(this.#readDefinite(aI * 2)),
          releaseLock,
        ),
        lock,
      ];
    }
    if (aI <= 27) {
      return [
        new CborMapDecodedStream(
          convert(
            this.#readDefinite(
              arrayToNumber(
                (await this.#read(2 ** (aI - 24), true)).buffer,
                true,
              ),
            ),
          ),
          releaseLock,
        ),
        lock,
      ];
    }
    if (aI === 31) {
      return [
        new CborMapDecodedStream(
          convert(this.#readIndefinite(false)),
          releaseLock,
        ),
        lock,
      ];
    }
    releaseLock();
    throw new RangeError(
      `Cannot decode value (0b101_${aI.toString(2).padStart(5, "0")})`,
    );
  }

  async #decodeSix(
    aI: number,
  ): Promise<
    Date | CborTag<CborStreamOutput> | [
      CborTag<CborStreamOutput>,
      lock: Promise<unknown>,
    ]
  > {
    const tagNumber = await this.#decodeZero(aI);
    const tagContent = await this.#decode(
      arrayToNumber((await this.#read(1, true)).buffer, true) as number,
    );
    switch (tagNumber) {
      case 0:
        if (typeof tagContent !== "string") {
          throw new TypeError(
            "Invalid DataItem: Expected text string to follow tag number 0",
          );
        }
        return new Date(tagContent);
      case 1:
        if (typeof tagContent !== "number" && typeof tagContent !== "bigint") {
          throw new TypeError(
            "Invalid DataItem: Expected integer or float to follow tagNumber 1",
          );
        }
        return new Date(Number(tagContent) * 1000);
    }
    if (tagContent instanceof Array) {
      return [new CborTag(tagNumber, tagContent[0]), tagContent[1]];
    }
    return new CborTag(tagNumber, tagContent);
  }

  async #decodeSeven(aI: number): Promise<undefined | null | boolean | number> {
    switch (aI) {
      case 20:
        return false;
      case 21:
        return true;
      case 22:
        return null;
      case 23:
        return undefined;
    }
    if (25 <= aI && aI <= 27) {
      return arrayToNumber(
        (await this.#read(2 ** (aI - 24), true)).buffer,
        false,
      );
    }
    throw new RangeError(
      `Cannot decode value (0b111_${aI.toString(2).padStart(5, "0")})`,
    );
  }

  /**
   * The {@link ReadableStream<CborStreamOutput>} associated with the instance,
   * which provides the decoded CBOR data as {@link CborStreamOutput} chunks.
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
   * @returns A {@link ReadableStream<CborStreamOutput>}.
   */
  get readable(): ReadableStream<CborStreamOutput> {
    return this.#readable;
  }

  /**
   * The {@link WritableStream<Uint8Array>} associated with the instance,
   * which accepts {@link Uint8Array} chunks to be decoded from CBOR format.
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
   * @returns A {@link WritableStream<Uint8Array>}.
   */
  get writable(): WritableStream<Uint8Array> {
    return this.#writable;
  }
}
