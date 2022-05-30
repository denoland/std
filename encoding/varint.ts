import * as wasm from "../_wasm_varint/varint.mjs";

const U32MAX = 4_294_967_295;
const U64MAX = 18_446_744_073_709_551_615n;

/**
 * ```ts
 * import { encodeU32 } from "./varint.ts";
 *
 * const encodedValue = encodeU32(42);
 * // Do something with the encoded value
 * ```
 */
export function encodeU32(val: number): Uint8Array {
  if (!Number.isInteger(val)) throw new TypeError("Floats are not supported");
  if (val < 0) throw new RangeError("Signed integers are not supported");
  if (val > U32MAX) throw new RangeError();
  return wasm.encode_u32(val);
}

/**
 * ```ts
 * import { encodeU64 } from "./varint.ts";
 *
 * const encodedValue = encodeU64(42n);
 * // Do something with the encoded value
 * ```
 */
export function encodeU64(val: bigint): Uint8Array {
  if (val < 0) throw new RangeError("Signed integers are not supported");
  if (val > U64MAX) throw new RangeError();
  return wasm.encode_u64(val);
}

/**
 * ```ts
 * import { decodeU32 } from "./varint.ts";
 * const bytes = Uint8Array.from([221, 199, 1]);
 * const decodedValue = decodeU32(bytes);
 *
 * // Do something with the decoded value
 * console.log(decodedValue === 25565);
 * ```
 */
export function decodeU32(val: Uint8Array): number {
  if (val.length > 5) throw RangeError("Too many bytes");
  try {
    return wasm.decode_u32(val);
  } catch {
    throw new RangeError("Bad varint");
  }
}

/**
 * ```ts
 * import { decodeU64 } from "./varint.ts";
 * const bytes = Uint8Array.from([221, 199, 1]);
 * const decodedValue = decodeU32(bytes);
 *
 * // Do something with the decoded value
 * console.log(decodedValue === 25565);
 * ```
 */
export function decodeU64(val: Uint8Array): BigInt {
  if (val.length > 10) throw RangeError("Too many bytes");
  try {
    return wasm.decode_u64(val);
  } catch {
    throw new RangeError("Bad varint");
  }
}
