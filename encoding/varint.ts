import * as wasm from "../_wasm_varint/varint.mjs";

/**
 * ```ts
 * import { encodeU32 } from "./varint.ts";
 *
 * const encodedValue = encodeU32(42);
 * // Do something with the encoded value
 * ```
 */
export function encodeU32(val: number): Uint8Array {
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
  return wasm.decode_u32(val);
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
export function decodeU64(val: Uint8Array): BigInt {
  return wasm.decode_u64(val);
}
