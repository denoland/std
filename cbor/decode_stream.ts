// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { arrayToNumber } from "./_common.ts";
import { upgradeStreamFromGen } from "./_common.ts";
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

/**
 * The CborByteDecodedStream is an extension of ReadableStream<Uint8Array> that
 * is outputted from {@link CborSequenceDecoderStream}.
 *
 * @example Usage
 * ```ts no-eval
 *
 * ```
 */
export class CborByteDecodedStream extends ReadableStream<Uint8Array> {
  /**
   * Constructs a new instance.
   *
   * @param gen A generator that yields the decoded CBOR byte string.
   */
  constructor(gen: AsyncGenerator<Uint8Array>) {
    super({
      async pull(controller) {
        const { done, value } = await gen.next();
        if (done) controller.close();
        else controller.enqueue(value);
      },
      async cancel() {
        // deno-lint-ignore no-empty
        for await (const _ of gen) {}
      },
    });
  }
}

/**
 * The CborTextDecodedStream is an extension of the ReadableStream<string> that
 * is outputted from {@link CborSequenceDecoderStream}.
 *
 * @example Usage
 * ```ts no-eval
 *
 * ```
 */
export class CborTextDecodedStream extends ReadableStream<string> {
  /**
   * Constructs a new instance.
   *
   * @param gen A generator that yields the decoded CBOR text string.
   */
  constructor(gen: AsyncGenerator<string>) {
    super({
      async pull(controller) {
        const { done, value } = await gen.next();
        if (done) controller.close();
        else controller.enqueue(value);
      },
      async cancel() {
        // deno-lint-ignore no-empty
        for await (const _ of gen) {}
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
 * ```ts no-eval
 *
 * ```
 */
export class CborArrayDecodedStream extends ReadableStream<CborOutputStream> {
  /**
   * Constructs a new instance.
   *
   * @param gen A generator that yields the decoded CBOR array.
   */
  constructor(gen: AsyncGenerator<CborOutputStream>) {
    super({
      async pull(controller) {
        const { done, value } = await gen.next();
        if (done) controller.close();
        else controller.enqueue(value);
      },
      async cancel() {
        // deno-lint-ignore no-empty
        for await (const _ of gen) {}
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
 * ```ts no-eval
 *
 * ```
 */
export class CborMapDecodedStream extends ReadableStream<CborMapOutputStream> {
  /**
   * Constructs a new instance.
   *
   * @param gen A generator that yields the decoded CBOR map.
   */
  constructor(gen: AsyncGenerator<CborMapOutputStream>) {
    super({
      async pull(controller) {
        const { done, value } = await gen.next();
        if (done) controller.close();
        else controller.enqueue(value);
      },
      async cancel() {
        // deno-lint-ignore no-empty
        for await (const _ of gen) {}
      },
    });
  }
}

/**
 * The CborSequenceDecoderStream decodes a CBOR encoded
 * ReadableStream<Uint8Array> into a sequence of {@link CborOutputStream}.
 *
 * @example Usage
 * ```ts no-eval
 *
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

  async *#decodeSequence(): AsyncGenerator<CborOutputStream> {
    while (true) {
      const value = await this.#read(1, false);
      if (value == undefined) return;
      // Since `value` is only 1 byte long, it will be of type `number`
      yield decode(this.#read, arrayToNumber(value.buffer, true) as number);
    }
  }

  /**
   * The ReadableStream property.
   *
   * @example Usage
   * ```ts no-eval
   *
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
   * ```ts no-eval
   *
   * ```
   *
   * @returns a WritableStream.
   */
  get writable(): WritableStream<Uint8Array> {
    return this.#writable;
  }
}

interface ReadFunc {
  (bytes: number, expectMore: true): Promise<Uint8Array>;
  (bytes: number, expectMore: false): Promise<Uint8Array | undefined>;
}

async function* readGen(
  read: ReadFunc,
  bytes: bigint,
): AsyncGenerator<Uint8Array> {
  for (let i = 0n; i < bytes; i += 2n ** 32n) {
    yield await read(Math.min(Number(bytes - i), 2 ** 32), true);
  }
}

async function* readDefinite(
  read: ReadFunc,
  items: number | bigint,
): AsyncGenerator<CborOutputStream> {
  items = BigInt(items);
  for (let i = 0n; i < items; ++i) {
    yield await decode(
      read,
      arrayToNumber((await read(1, true)).buffer, true) as number,
    );
  }
}

async function* readIndefinite(
  read: ReadFunc,
  denyInnerIndefinite: boolean,
  message?: string,
): AsyncGenerator<CborOutputStream> {
  while (true) {
    const byte = arrayToNumber((await read(1, true)).buffer, true) as number;
    if (byte === 0b111_11111) break;
    if (denyInnerIndefinite && (byte & 0b000_11111) === 31) {
      throw new TypeError(message);
    }
    yield await decode(read, byte);
  }
}

function decode(read: ReadFunc, byte: number): Promise<CborOutputStream> {
  const majorType = byte >> 5;
  const aI = byte & 0b000_11111;
  switch (majorType) {
    case 0:
      return decodeZero(read, aI);
    case 1:
      return decodeOne(read, aI);
    case 2:
      return decodeTwo(read, aI);
    case 3:
      return decodeThree(read, aI);
    case 4:
      return decodeFour(read, aI);
    case 5:
      return decodeFive(read, aI);
    case 6:
      return decodeSix(read, aI);
    default:
      return decodeSeven(read, aI);
  }
}

async function decodeZero(
  read: ReadFunc,
  aI: number,
): Promise<number | bigint> {
  if (aI < 24) return aI;
  read(1, true);
  if (aI <= 27) {
    return arrayToNumber((await read(2 ** (aI - 24), true)).buffer, true);
  }
  throw new RangeError(
    `Cannot decode value (0b000_${aI.toString(2).padStart(5, "0")})`,
  );
}

async function decodeOne(read: ReadFunc, aI: number): Promise<number | bigint> {
  if (aI > 27) {
    throw new RangeError(
      `Cannot decode value (0b001_${aI.toString(2).padStart(5, "0")})`,
    );
  }
  const x = await decodeZero(read, aI);
  return typeof x === "bigint" ? -x - 1n : -x - 1;
}

async function decodeTwo(
  read: ReadFunc,
  aI: number,
): Promise<Uint8Array | CborByteDecodedStream> {
  if (aI < 24) return await read(aI, true);
  if (aI <= 27) {
    const bytes = arrayToNumber(
      (await read(2 ** (aI - 24), true)).buffer,
      true,
    );
    return typeof bytes === "bigint"
      ? new CborByteDecodedStream(readGen(read, bytes))
      : await read(bytes, true);
  }
  if (aI === 31) {
    return new CborByteDecodedStream(async function* () {
      for await (const x of readIndefinite(read, true, "")) {
        if (x instanceof Uint8Array) yield x;
        else if (x instanceof CborByteDecodedStream) {
          for await (const y of x) yield y;
        } else throw new TypeError();
      }
    }());
  }
  throw new RangeError(
    `Cannot decode value (0b010_${aI.toString(2).padStart(5, "0")})`,
  );
}

async function decodeThree(
  read: ReadFunc,
  aI: number,
): Promise<string | CborTextDecodedStream> {
  if (aI < 24) return new TextDecoder().decode(await read(aI, true));
  if (aI <= 27) {
    const bytes = arrayToNumber(
      (await read(2 ** (aI - 24), true)).buffer,
      true,
    );
    return typeof bytes === "bigint"
      ? new CborTextDecodedStream(async function* () {
        const decoder = new TextDecoder();
        for await (const chunk of readGen(read, bytes)) {
          yield decoder.decode(chunk, { stream: true });
        }
      }())
      : new TextDecoder().decode(await read(bytes, true));
  }
  if (aI === 31) {
    return new CborTextDecodedStream(async function* () {
      for await (const x of readIndefinite(read, true, "")) {
        if (typeof x === "string") yield x;
        else if (x instanceof CborTextDecodedStream) {
          for await (const y of x) yield y;
        } else throw new TypeError();
      }
    }());
  }
  throw new RangeError(
    `Cannot decode value (0b011_${aI.toString(2).padStart(5, "0")})`,
  );
}

async function decodeFour(
  read: ReadFunc,
  aI: number,
): Promise<CborArrayDecodedStream> {
  if (aI < 24) return new CborArrayDecodedStream(readDefinite(read, aI));
  if (aI <= 27) {
    return new CborArrayDecodedStream(
      readDefinite(
        read,
        arrayToNumber((await read(2 ** (aI - 24), true)).buffer, true),
      ),
    );
  }
  if (aI === 31) return new CborArrayDecodedStream(readIndefinite(read, false));
  throw new Error(`Unexpected value: 0b100_${aI.toString(2).padStart(5, "0")}`);
}

async function decodeFive(
  read: ReadFunc,
  aI: number,
): Promise<CborMapDecodedStream> {
  async function* convert(
    gen: AsyncGenerator<CborOutputStream>,
  ): AsyncGenerator<CborMapOutputStream> {
    while (true) {
      const key = await gen.next();
      if (key.done) break;
      if (typeof key.value !== "string") throw new TypeError();

      const value = await gen.next();
      if (value.done) throw new RangeError();

      yield [key.value, value.value];
    }
  }

  if (aI < 24) {
    return new CborMapDecodedStream(convert(readDefinite(read, aI * 2)));
  }
  if (aI <= 27) {
    return new CborMapDecodedStream(
      convert(
        readDefinite(
          read,
          arrayToNumber((await read(2 ** (aI - 24), true)).buffer, true),
        ),
      ),
    );
  }
  if (aI === 31) {
    return new CborMapDecodedStream(convert(readIndefinite(read, false)));
  }
  throw new RangeError(
    `Cannot decode value (0b101_${aI.toString(2).padStart(5, "0")})`,
  );
}

async function decodeSix(
  read: ReadFunc,
  aI: number,
): Promise<Date | CborTag<CborOutputStream>> {
  const tagNumber = await decodeZero(read, aI);
  const tagContent = await decode(
    read,
    arrayToNumber((await read(1, true)).buffer, true) as number,
  );
  switch (tagNumber) {
    case 0:
      if (typeof tagContent !== "string") throw new TypeError();
      return new Date(tagContent);
    case 1:
      if (typeof tagContent !== "number" && typeof tagContent !== "bigint") {
        throw new TypeError();
      }
      return new Date(Number(tagContent) * 1000);
  }
  return new CborTag(tagNumber, tagContent);
}

async function decodeSeven(
  read: ReadFunc,
  aI: number,
): Promise<undefined | null | boolean | number> {
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
    return arrayToNumber((await read(2 ** (aI - 24), true)).buffer, false);
  }
  throw new RangeError(
    `Cannot decode value (0b111_${aI.toString(2).padStart(5, "0")})`,
  );
}
