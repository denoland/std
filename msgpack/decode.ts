// Copyright 2018-2025 the Deno authors. MIT license.
// This module is browser compatible.

import type { ValueType } from "./encode.ts";

/**
 * Decode a value from the {@link https://msgpack.org/ | MessagePack} binary format.
 *
 * If the input is not in valid message pack format, an error will be thrown.
 *
 * @example Usage
 * ```ts
 * import { decode } from "@std/msgpack/decode";
 * import { assertEquals } from "@std/assert";
 *
 * const encoded = new Uint8Array([163, 72, 105, 33]);
 *
 * assertEquals(decode(encoded), "Hi!");
 * ```
 *
 * @param data MessagePack binary data.
 * @returns Decoded value from the MessagePack binary data.
 */
export function decode(data: Uint8Array): ValueType {
  const pointer = { consumed: 0 };
  const dataView = new DataView(
    data.buffer,
    data.byteOffset,
    data.byteLength,
  );
  const value = decodeSlice(data, dataView, pointer);

  if (pointer.consumed < data.length) {
    throw new EvalError("Messagepack decode did not consume whole array");
  }

  return value;
}

/**
 * A TransformStream that decodes {@link https://msgpack.org/ | MessagePack} binary data.
 *
 * Transforms a stream of Uint8Array chunks into a stream of decoded values.
 * Handles messages that may be split across multiple chunks.
 *
 * @example Usage
 * ```ts
 * import { DecodeStream } from "@std/msgpack/decode";
 * import { assertEquals } from "@std/assert";
 *
 * const encoded = ReadableStream.from([
 *   Uint8Array.of(163, 72, 105, 33), // "Hi!"
 *   Uint8Array.of(42), // 42
 * ]);
 *
 * const results = await Array.fromAsync(encoded.pipeThrough(new DecodeStream()));
 * assertEquals(results, ["Hi!", 42]);
 * ```
 */
export class DecodeStream extends TransformStream<Uint8Array, ValueType> {
  constructor() {
    let buffer = new Uint8Array(0);

    super({
      transform(chunk, controller) {
        // Append chunk to buffer
        const newBuffer = new Uint8Array(buffer.length + chunk.length);
        newBuffer.set(buffer);
        newBuffer.set(chunk, buffer.length);
        buffer = newBuffer;

        // Decode as many complete messages as possible
        while (buffer.length > 0) {
          const pointer = { consumed: 0 };
          const dataView = new DataView(
            buffer.buffer,
            buffer.byteOffset,
            buffer.byteLength,
          );

          try {
            const decoded = decodeSlice(buffer, dataView, pointer);
            buffer = buffer.subarray(pointer.consumed);
            controller.enqueue(decoded);
          } catch (error) {
            // If incomplete data, wait for more chunks
            if (
              error instanceof EvalError &&
              error.message.includes("prematurely")
            ) {
              break;
            }
            throw error;
          }
        }
      },

      flush() {
        if (buffer.length > 0) {
          throw new EvalError(
            "Stream ended with incomplete MessagePack data",
          );
        }
      },
    });
  }
}

function decodeString(
  uint8: Uint8Array,
  size: number,
  pointer: { consumed: number },
) {
  pointer.consumed += size;
  const u8 = uint8.subarray(pointer.consumed - size, pointer.consumed);
  if (u8.length !== size) {
    throw new EvalError(
      "Messagepack decode reached end of array prematurely",
    );
  }
  return decoder.decode(u8);
}

function decodeArray(
  uint8: Uint8Array,
  dataView: DataView,
  size: number,
  pointer: { consumed: number },
) {
  const arr: ValueType[] = [];

  for (let i = 0; i < size; i++) {
    const value = decodeSlice(uint8, dataView, pointer);
    arr.push(value);
  }

  return arr;
}

function decodeMap(
  uint8: Uint8Array,
  dataView: DataView,
  size: number,
  pointer: { consumed: number },
) {
  const map: Record<number | string, ValueType> = {};

  for (let i = 0; i < size; i++) {
    const key = decodeSlice(uint8, dataView, pointer);
    const value = decodeSlice(uint8, dataView, pointer);

    if (typeof key !== "number" && typeof key !== "string") {
      throw new EvalError(
        "Cannot decode a key of a map: The type of key is invalid, keys must be a number or a string",
      );
    }

    map[key] = value;
  }

  return map;
}

const decoder = new TextDecoder();

const FIXMAP_BITS = 0b1000_0000;
const FIXMAP_MASK = 0b1111_0000;
const FIXARRAY_BITS = 0b1001_0000;
const FIXARRAY_MASK = 0b1111_0000;
const FIXSTR_BITS = 0b1010_0000;
const FIXSTR_MASK = 0b1110_0000;

/**
 * Given a uint8array which contains a msgpack object,
 * return the value of the object as well as how many bytes
 * were consumed in obtaining this object
 */
function decodeSlice(
  uint8: Uint8Array,
  dataView: DataView,
  pointer: { consumed: number },
): ValueType {
  if (pointer.consumed >= uint8.length) {
    throw new EvalError("Messagepack decode reached end of array prematurely");
  }
  const type = dataView.getUint8(pointer.consumed);
  pointer.consumed++;

  if (type <= 0x7f) { // positive fixint - really small positive number
    return type;
  }

  if ((type & FIXMAP_MASK) === FIXMAP_BITS) { // fixmap - small map
    const size = type & ~FIXMAP_MASK;
    return decodeMap(uint8, dataView, size, pointer);
  }

  if ((type & FIXARRAY_MASK) === FIXARRAY_BITS) { // fixarray - small array
    const size = type & ~FIXARRAY_MASK;
    return decodeArray(uint8, dataView, size, pointer);
  }

  if ((type & FIXSTR_MASK) === FIXSTR_BITS) { // fixstr - small string
    const size = type & ~FIXSTR_MASK;
    return decodeString(uint8, size, pointer);
  }

  if (type >= 0xe0) { // negative fixint - really small negative number
    return type - 256;
  }

  switch (type) {
    case 0xc0: // nil
      return null;
    case 0xc1: // (never used)
      throw new Error(
        "Messagepack decode encountered a type that is never used",
      );
    case 0xc2: // false
      return false;
    case 0xc3: // true
      return true;
    case 0xc4: { // bin 8 - small Uint8Array
      if (pointer.consumed >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint8(pointer.consumed);
      pointer.consumed++;
      const u8 = uint8.subarray(pointer.consumed, pointer.consumed + length);
      if (u8.length !== length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      pointer.consumed += length;
      return u8;
    }
    case 0xc5: { // bin 16 - medium Uint8Array
      if (pointer.consumed + 1 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint16(pointer.consumed);
      pointer.consumed += 2;
      const u8 = uint8.subarray(pointer.consumed, pointer.consumed + length);
      if (u8.length !== length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      pointer.consumed += length;
      return u8;
    }
    case 0xc6: { // bin 32 - large Uint8Array
      if (pointer.consumed + 3 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint32(pointer.consumed);
      pointer.consumed += 4;
      const u8 = uint8.subarray(pointer.consumed, pointer.consumed + length);
      if (u8.length !== length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      pointer.consumed += length;
      return u8;
    }
    case 0xc7: // ext 8 - small extension type
    case 0xc8: // ext 16 - medium extension type
    case 0xc9: // ext 32 - large extension type
      throw new Error(
        "Cannot decode a slice: Large extension type 'ext' not implemented yet",
      );
    case 0xca: { // float 32
      if (pointer.consumed + 3 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getFloat32(pointer.consumed);
      pointer.consumed += 4;
      return value;
    }
    case 0xcb: { // float 64
      if (pointer.consumed + 7 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getFloat64(pointer.consumed);
      pointer.consumed += 8;
      return value;
    }
    case 0xcc: { // uint 8
      if (pointer.consumed >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getUint8(pointer.consumed);
      pointer.consumed += 1;
      return value;
    }
    case 0xcd: { // uint 16
      if (pointer.consumed + 1 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getUint16(pointer.consumed);
      pointer.consumed += 2;
      return value;
    }
    case 0xce: { // uint 32
      if (pointer.consumed + 3 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getUint32(pointer.consumed);
      pointer.consumed += 4;
      return value;
    }
    case 0xcf: { // uint 64
      if (pointer.consumed + 7 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getBigUint64(pointer.consumed);
      pointer.consumed += 8;
      return value;
    }
    case 0xd0: { // int 8
      if (pointer.consumed >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getInt8(pointer.consumed);
      pointer.consumed += 1;
      return value;
    }
    case 0xd1: { // int 16
      if (pointer.consumed + 1 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getInt16(pointer.consumed);
      pointer.consumed += 2;
      return value;
    }
    case 0xd2: { // int 32
      if (pointer.consumed + 3 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getInt32(pointer.consumed);
      pointer.consumed += 4;
      return value;
    }
    case 0xd3: { // int 64
      if (pointer.consumed + 7 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const value = dataView.getBigInt64(pointer.consumed);
      pointer.consumed += 8;
      return value;
    }
    case 0xd4: // fixext 1 - 1 byte extension type
    case 0xd5: // fixext 2 - 2 byte extension type
    case 0xd6: // fixext 4 - 4 byte extension type
    case 0xd7: // fixext 8 - 8 byte extension type
    case 0xd8: // fixext 16 - 16 byte extension type
      throw new Error("Cannot decode a slice: 'fixext' not implemented yet");
    case 0xd9: { // str 8 - small string
      if (pointer.consumed >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint8(pointer.consumed);
      pointer.consumed += 1;
      return decodeString(uint8, length, pointer);
    }
    case 0xda: { // str 16 - medium string
      if (pointer.consumed + 1 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint16(pointer.consumed);
      pointer.consumed += 2;
      return decodeString(uint8, length, pointer);
    }
    case 0xdb: { // str 32 - large string
      if (pointer.consumed + 3 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint32(pointer.consumed);
      pointer.consumed += 4;
      return decodeString(uint8, length, pointer);
    }
    case 0xdc: { // array 16 - medium array
      if (pointer.consumed + 1 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint16(pointer.consumed);
      pointer.consumed += 2;
      return decodeArray(uint8, dataView, length, pointer);
    }
    case 0xdd: { // array 32 - large array
      if (pointer.consumed + 3 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint32(pointer.consumed);
      pointer.consumed += 4;
      return decodeArray(uint8, dataView, length, pointer);
    }
    case 0xde: { // map 16 - medium map
      if (pointer.consumed + 1 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint16(pointer.consumed);
      pointer.consumed += 2;
      return decodeMap(uint8, dataView, length, pointer);
    }
    case 0xdf: { // map 32 - large map
      if (pointer.consumed + 3 >= uint8.length) {
        throw new EvalError(
          "Messagepack decode reached end of array prematurely",
        );
      }
      const length = dataView.getUint32(pointer.consumed);
      pointer.consumed += 4;
      return decodeMap(uint8, dataView, length, pointer);
    }
  }

  // All cases are covered for numbers between 0-255. Typescript isn't smart enough to know that.
  throw new Error("Unreachable");
}
