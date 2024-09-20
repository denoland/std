// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { numberToArray, upgradeStreamFromGen } from "./_common.ts";
import { type CborPrimitiveType, CborTag, encodeCbor } from "./encode.ts";

/**
 * This type specifies the encodable values for
 * {@link CborSequenceEncoderStream} and {@link CborArrayEncoderStream}.
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
 * This type specifies the structure of input for {@link CborMapEncoderStream}.
 */
export type CborMapInputStream = [string, CborInputStream];

/**
 * The CborByteEncoderStream encodes a ReadableStream<Uint8Array> into a CBOR
 * "indefinite byte string".
 *
 * @example Usage
 * ```ts ignore
 *
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
   * Derives a new instance from an {@link AsyncIterable} or {@link Iterable}.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @param asyncIterable The iterable to convert to a {@link CborByteEncoderStream} instance.
   * @returns a {@link CborByteEncoderStream} instance.
   */
  static from(
    asyncIterable: AsyncIterable<Uint8Array> | Iterable<Uint8Array>,
  ): CborByteEncoderStream {
    const encoder = new CborByteEncoderStream();
    ReadableStream.from(asyncIterable).pipeTo(encoder.writable);
    return encoder;
  }

  /**
   * The ReadableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a ReadableStream.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The WritableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a WritableStream.
   */
  get writable(): WritableStream<Uint8Array> {
    return this.#writable;
  }
}

/**
 * The CborTextEncoderStream encodes a ReadableStream<string> into a CBOR
 * "indefinite text string".
 *
 * @example Usage
 * ```ts ignore
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
   * Derives a new instance from an {@link AsyncIterable} or {@link Iterable}.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @param asyncIterable The iterable to convert to a {@link CborTextEncoderStream} instance.
   * @returns a {@link CborTextEncoderStream} instance.
   */
  static from(
    asyncIterable: AsyncIterable<string> | Iterable<string>,
  ): CborTextEncoderStream {
    const encoder = new CborTextEncoderStream();
    ReadableStream.from(asyncIterable).pipeTo(encoder.writable);
    return encoder;
  }

  /**
   * The ReadableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a ReadableStream.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The WritableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a WritableStream.
   */
  get writable(): WritableStream<string> {
    return this.#writable;
  }
}

/**
 * The CborArrayEncoderStream encodes a ReadableStream<CborInputStream> into a CBOR
 * "indefinite array".
 *
 * @example Usage
 * ```ts ignore
 *
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
   * Derives a new instance from an {@link AsyncIterable} or {@link Iterable}.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @param asyncIterable The iterable to convert to a {@link CborArrayEncoderStream} instance.
   * @returns a {@link CborArrayEncoderStream} instance.
   */
  static from(
    asyncIterable: AsyncIterable<CborInputStream> | Iterable<CborInputStream>,
  ): CborArrayEncoderStream {
    const encoder = new CborArrayEncoderStream();
    ReadableStream.from(asyncIterable).pipeTo(encoder.writable);
    return encoder;
  }

  /**
   * The ReadableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a ReadableStream.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The WritableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a WritableStream.
   */
  get writable(): WritableStream<CborInputStream> {
    return this.#writable;
  }
}

/**
 * The CborByteEncoderStream encodes a ReadableStream<CborMapInputStream> into a CBOR
 * "indefinite map".
 *
 * @example Usage
 * ```ts ignore
 *
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
   * Derives a new instance from an {@link AsyncIterable} or {@link Iterable}.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @param asyncIterable The iterable to convert to a {@link CborMapEncoderStream} instance.
   * @returns a {@link CborMapEncoderStream} instance.
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
   * The ReadableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a ReadableStream.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The WritableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a WritableStream.
   */
  get writable(): WritableStream<CborMapInputStream> {
    return this.#writable;
  }
}

/**
 * The CborSequenceEncoderStream encodes a ReadableStream<CborInputStream> into
 * a sequence of CBOR encoded values.
 *
 * @example Usage
 * ```ts ignore
 *
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
    head[0]! = 0b110_00000;
    yield head;
    for await (const y of this.#encode(x.tagContent)) {
      yield y;
    }
  }

  /**
   * Derives a new instance from an {@link AsyncIterable} or {@link Iterable}.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @param asyncIterable The iterable to convert to a {@link CborSequenceEncoderStream} instance.
   * @returns a {@link CborSequenceEncoderStream} instance.
   */
  static from(
    asyncIterable: AsyncIterable<CborInputStream> | Iterable<CborInputStream>,
  ): CborSequenceEncoderStream {
    const encoder = new CborSequenceEncoderStream();
    ReadableStream.from(asyncIterable).pipeTo(encoder.writable);
    return encoder;
  }

  /**
   * The ReadableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a ReadableStream.
   */
  get readable(): ReadableStream<Uint8Array> {
    return this.#readable;
  }

  /**
   * The WritableStream property.
   *
   * @example Usage
   * ```ts ignore
   *
   * ```
   *
   * @returns a WritableStream.
   */
  get writable(): WritableStream<CborInputStream> {
    return this.#writable;
  }
}
