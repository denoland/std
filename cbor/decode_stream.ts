// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { arrayToNumber, upgradeStreamFromGen } from "./_common.ts";
import { type CborPrimitiveType, CborTag } from "./encode.ts";

/**
 * This type specifies the decodable values for
 * {@link CborSequenceDecoderStream}.
 */
export type CborOutputStream =
  | CborPrimitiveType
  | CborTag<CborOutputStream>
  | CborByteDecodedStream
  | CborTextDecodedStream
  | CborArrayDecodedStream
  | CborMapDecodedStream;
/**
 * This type specifies the structure of output for {@link CborMapDecodedStream}.
 */
export type CborMapOutputStream = [string, CborOutputStream];

type ReleaseLock = (value?: unknown) => void;

/**
 * The CborByteDecodedStream is an extension of ReadableStream<Uint8Array> that
 * is outputted from {@link CborSequenceDecoderStream}.
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
export class CborByteDecodedStream extends ReadableStream<Uint8Array> {
  /**
   * Constructs a new instance.
   *
   * @param gen A generator that yields the decoded CBOR byte string.
   * @param releaseLock A function to call when the stream is finished.
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

/**
 * The CborTextDecodedStream is an extension of the ReadableStream<string> that
 * is outputted from {@link CborSequenceDecoderStream}.
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
export class CborTextDecodedStream extends ReadableStream<string> {
  /**
   * Constructs a new instance.
   *
   * @param gen A generator that yields the decoded CBOR text string.
   * @param releaseLock A function to call when the stream is finished.
   */
  constructor(gen: AsyncGenerator<string>, releaseLock: ReleaseLock) {
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

/**
 * The CborArrayDecodedStream is an extension of the
 * ReadableStream<CborOutputStream> that is outputted from
 * {@link CborSequenceDecoderStream}.
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
export class CborArrayDecodedStream extends ReadableStream<CborOutputStream> {
  /**
   * Constructs a new instance.
   *
   * @param gen A generator that yields the decoded CBOR array.
   * @param releaseLock A function to call when the stream is finished.
   */
  constructor(gen: AsyncGenerator<CborOutputStream>, releaseLock: ReleaseLock) {
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

/**
 * The CborMapDecodedStream is an extension of the
 * ReadableStream<CborMapOutputStream> that is outputted from
 * {@link CborSequenceDecoderStream}.
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
export class CborMapDecodedStream extends ReadableStream<CborMapOutputStream> {
  /**
   * Constructs a new instance.
   *
   * @param gen A generator that yields the decoded CBOR map.
   * @param releaseLock A function to call when the stream is finished.
   */
  constructor(
    gen: AsyncGenerator<CborMapOutputStream>,
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

/**
 * The CborSequenceDecoderStream decodes a CBOR encoded
 * ReadableStream<Uint8Array> into a sequence of {@link CborOutputStream}.
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
export class CborSequenceDecoderStream
  implements TransformStream<Uint8Array, CborOutputStream> {
  #source: ReadableStreamBYOBReader;
  #readable: ReadableStream<CborOutputStream>;
  #writable: WritableStream<Uint8Array>;
  /**
   * Constructs a new instance.
   */
  constructor() {
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    try {
      this.#source = readable.getReader({ mode: "byob" });
    } catch {
      this.#source = upgradeStreamFromGen(async function* () {
        for await (const chunk of readable) {
          yield chunk;
        }
      }()).getReader({ mode: "byob" });
    }
    this.#readable = ReadableStream.from<CborOutputStream>(
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
  ): AsyncGenerator<CborOutputStream> {
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
  ): AsyncGenerator<CborOutputStream> {
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

  async *#decodeSequence(): AsyncGenerator<CborOutputStream> {
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
  ): Promise<CborOutputStream | [CborOutputStream, lock: Promise<unknown>]> {
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
      } else {return new TextDecoder().decode(
          await this.#read(Number(bytes), true),
        );}
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
      gen: AsyncGenerator<CborOutputStream>,
    ): AsyncGenerator<CborMapOutputStream> {
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
    Date | CborTag<CborOutputStream> | [
      CborTag<CborOutputStream>,
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
   * The ReadableStream property.
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
   * @returns a ReadableStream.
   */
  get readable(): ReadableStream<CborOutputStream> {
    return this.#readable;
  }

  /**
   * The WritableStream property.
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
   * @returns a WritableStream.
   */
  get writable(): WritableStream<Uint8Array> {
    return this.#writable;
  }
}
