// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

/**
 * Functions for encoding typed integers in array buffers.
 *
 * @module
 */

import { instantiate } from "./_wasm/lib/deno_std_wasm_varint.generated.mjs";

const U32MAX = 4_294_967_295;
const U64MAX = 18_446_744_073_709_551_615n;

/**
 * Encodes the given `number` into `Uint8Array` with LEB128. The number needs to be in the range of `0` and `0xffffffff`.
 * ```ts
 * import { encodeU32 } from "https://deno.land/std@$STD_VERSION/encoding/varint/mod.ts";
 *
 * const encodedValue = encodeU32(42);
 * // Do something with the encoded value
 * ```
 */
export function encodeU32(val: number): Uint8Array {
  if (!Number.isInteger(val)) throw new TypeError("Floats are not supported");
  if (val < 0) throw new RangeError("Signed integers are not supported");
  if (val > U32MAX) {
    throw new RangeError(
      `The given number exceeds the limit of unsigned integer: ${val}`,
    );
  }
  const wasm = instantiate();
  return wasm.encode_u32(val);
}

/**
 * Encodes the given `BigInt` into `Uint8Array` with LEB128. The number needs to be in the range of `0` and `0xffffffffffffffff`.
 * ```ts
 * import { encodeU64 } from "https://deno.land/std@$STD_VERSION/encoding/varint/mod.ts";
 *
 * const encodedValue = encodeU64(42n);
 * // Do something with the encoded value
 * ```
 */
export function encodeU64(val: bigint): Uint8Array {
  if (val < 0) throw new RangeError("Signed integers are not supported");
  if (val > U64MAX) {
    throw new RangeError(
      `The given number exceeds the limit of unsigned long integer: ${val}`,
    );
  }
  const wasm = instantiate();
  return wasm.encode_u64(val);
}

/**
 * Decodes the given `Uint8Array` into a `number` with LEB128.
 * ```ts
 * import { decodeU32 } from "https://deno.land/std@$STD_VERSION/encoding/varint/mod.ts";
 * const bytes = Uint8Array.from([221, 199, 1]);
 * const decodedValue = decodeU32(bytes);
 *
 * // Do something with the decoded value
 * console.log(decodedValue === 25565);
 * ```
 */
export function decodeU32(val: Uint8Array): number {
  if (val.length > 5) throw RangeError("Too many bytes");
  const wasm = instantiate();
  try {
    return wasm.decode_u32(val);
  } catch {
    throw new RangeError(`Bad varint: ${val}`);
  }
}

/**
 * Decodes the given `Uint8Array` into a `BigInt` with LEB128.
 * ```ts
 * import { decodeU64 } from "https://deno.land/std@$STD_VERSION/encoding/varint/mod.ts";
 * const bytes = Uint8Array.from([221, 199, 1]);
 * const decodedValue = decodeU64(bytes);
 *
 * // Do something with the decoded value
 * console.log(decodedValue === 25565n);
 * ```
 */
export function decodeU64(val: Uint8Array): bigint {
  if (val.length > 10) throw RangeError("Too many bytes");
  const wasm = instantiate();
  try {
    return wasm.decode_u64(val);
  } catch {
    throw new RangeError(`Bad varint: ${val}`);
  }
}
