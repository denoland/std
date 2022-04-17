// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import wasmBytes from "./crypto.wasm.mjs";

/**
 * All cryptographic hash/digest algorithms supported by std/_wasm_crypto.
 *
 * For algorithms that are supported by WebCrypto, the name here must match the
 * one used by WebCrypto. Otherwise we should prefer the formatting used in the
 * official specification. All names are uppercase to facilitate case-insensitive
 * comparisons required by the WebCrypto spec.
 */
// IMPORTANT: Indices must match the ContextType enum in src/digest.rs
export const digestAlgorithms = [
  "BLAKE2B",
  "BLAKE2B-256",
  "BLAKE2B-384",
  "BLAKE2S",
  "BLAKE3",
  "KECCAK-224",
  "KECCAK-256",
  "KECCAK-384",
  "KECCAK-512",
  "MD4",
  "MD5",
  "RIPEMD-160",
  "SHA-1",
  "SHA3-224",
  "SHA3-256",
  "SHA3-384",
  "SHA3-512",
  "SHA-224",
  "SHA-256",
  "SHA-384",
  "SHA-512",
  "SHAKE128",
  "SHAKE256",
  "TIGER",
] as const;

const digestLengths = {
  "BLAKE2B-256": 32,
  "BLAKE2B-384": 48,
  "BLAKE2B": 64,
  "BLAKE2S": 32,
  "BLAKE3": 48,
  "KECCAK-224": 28,
  "KECCAK-256": 32,
  "KECCAK-384": 48,
  "KECCAK-512": 64,
  "SHA-384": 48,
  "SHA3-224": 28,
  "SHA3-256": 32,
  "SHA3-384": 48,
  "SHA3-512": 64,
  "SHAKE128": 32,
  "SHAKE256": 64,
  "TIGER": 24,
  "RIPEMD-160": 20,
  "SHA-224": 28,
  "SHA-256": 32,
  "SHA-512": 64,
  "MD4": 16,
  "MD5": 16,
  "SHA-1": 20,
};

/** An algorithm name supported by std/_wasm_crypto. */
export type DigestAlgorithm = typeof digestAlgorithms[number];

export type WasmModuleExports = {
  memory: WebAssembly.Memory;
  digest_malloc: (size: number) => number;
  digest(
    algorithm: number,
    data: number,
    dataSize: number,
    outSize: number,
  ): number;
  digest_context_new(algorithm: number): number;
  digest_context_free(context: number): void;
  digest_context_update(
    context: number,
    data: number,
    dataSize: number,
  ): void;
  digest_context_digest(
    context: number,
    outSize: number,
  ): number;
  digest_context_reset(
    context: number,
  ): void;
};

const wasmModule = new WebAssembly.Module(wasmBytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, {});
const wasm = wasmInstance.exports as WasmModuleExports;

// For testing
export const _wasmBytes = wasmBytes;

function malloc(u8: Uint8Array, size: number): number {
  const ptr = wasm.digest_malloc(size);
  if (ptr === 0) {
    throw new Error("Out of memory");
  }
  const mem = new Uint8Array(wasm.memory.buffer);
  mem.subarray(ptr, ptr + size).set(u8);
  return ptr;
}

function getBytes(ptr: number, size: number): Uint8Array {
  const u8 = new Uint8Array(wasm.memory.buffer);
  return u8.subarray(ptr, ptr + size);
}

export function digest(
  algorithm: DigestAlgorithm,
  data: Uint8Array,
  outLength?: number,
): Uint8Array {
  const digestIndex = digestAlgorithms.indexOf(algorithm);
  if (digestIndex === -1) {
    throw new Error(`Unsupported digest algorithm: ${algorithm}`);
  }
  const dataLength = data.byteLength;
  const dataPtr = malloc(data, dataLength);
  const digestLength = outLength || digestLengths[algorithm];
  const digestPtr = wasm.digest(digestIndex, dataPtr, dataLength, digestLength);
  return getBytes(digestPtr, digestLength);
}

export class DigestContext {
  #algorithm: DigestAlgorithm;
  #ptr: number;

  /**
   * Creates a new context incrementally computing a digest using the given
   * hash algorithm.
   *
   * An error will be thrown if `algorithm` is not a supported hash algorithm.
   * @param {string} algorithm
   */
  constructor(algorithm: DigestAlgorithm) {
    const digestIndex = digestAlgorithms.indexOf(algorithm);
    if (digestIndex === -1) {
      throw new Error(`Unsupported digest algorithm: ${algorithm}`);
    }
    this.#algorithm = algorithm;
    this.#ptr = wasm.digest_context_new(digestIndex);
  }

  /**
   * Update the digest's internal state with the additional input `data`.
   * @param {Uint8Array} data
   */
  update(data: Uint8Array): void {
    const dataLength = data.byteLength;
    const dataPtr = malloc(data, dataLength);
    wasm.digest_context_update(this.#ptr, dataPtr, dataLength);
  }

  /**
   * Returns the digest of the input data so far. This may be called repeatedly
   * without side effects.
   *
   * `length` will usually be left `undefined` to use the default length for
   * the algorithm. For algorithms with variable-length output, it can be used
   * to specify a non-negative integer number of bytes.
   *
   * An error will be thrown if `algorithm` is not a supported hash algorithm or
   * `length` is not a supported length for the algorithm.
   * @param {number | undefined} length
   * @returns {Uint8Array}
   */
  digest(length?: number): Uint8Array {
    if (length === undefined) {
      length = digestLengths[this.#algorithm];
    }
    if (length < 0) {
      throw new Error(`Invalid digest length: ${length}`);
    }
    const digestPtr = wasm.digest_context_digest(this.#ptr, length);
    return getBytes(digestPtr, length);
  }

  /**
   * Resets this context to its initial state, as though it has not yet been
   * provided with any input data. (It will still use the same algorithm.)
   */
  reset() {
    wasm.digest_context_reset(this.#ptr);
  }
}
