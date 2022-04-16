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
  "BLAKE2B-256",
  "BLAKE2B-384",
  "BLAKE2B",
  "BLAKE2S",
  "BLAKE3",
  "KECCAK-224",
  "KECCAK-256",
  "KECCAK-384",
  "KECCAK-512",
  "SHA-384",
  "SHA3-224",
  "SHA3-256",
  "SHA3-384",
  "SHA3-512",
  "SHAKE128",
  "SHAKE256",
  "TIGER",
  // insecure (length-extendable):
  "RIPEMD-160",
  "SHA-224",
  "SHA-256",
  "SHA-512",
  // insecure (collidable and length-extendable):
  "MD4",
  "MD5",
  "SHA-1",
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

const wasmModule = new WebAssembly.Module(wasmBytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, {});
const wasm = wasmInstance.exports;

export function digest(algorithm: DigestAlgorithm, data: Uint8Array): Uint8Array {
  const digestIndex = digestAlgorithms.indexOf(algorithm);
  if (digestIndex === -1) {
    throw new Error(`Unsupported digest algorithm: ${algorithm}`);
  }

  const dataLength = data.byteLength;
  const dataPtr = malloc(dataLength);
  // Copy data to wasm memory.
  const heap = new Uint8Array(wasmInstance.exports.memory.buffer);
  heap.set(data, dataPtr);

  const digestPtr = wasm.digest(digestIndex, dataPtr, dataLength);
  const digestLength = digestLengths[algorithm];
  const digest = new Uint8Array(wasmInstance.exports.memory.buffer, digestPtr, digestLength);
  return digest;
}

function malloc(size: number): number {
  return wasm.digest_malloc(size);
}
