// Copyright 2018-2025 the Deno authors. MIT license.
import { crypto as stdCrypto } from "../crypto.ts";
import { instantiateWithInstance } from "../_wasm/lib/deno_std_wasm_crypto.generated.mjs";
import { encodeHex } from "../../encoding/hex.ts";

const memory = instantiateWithInstance().instance.exports
  .memory as WebAssembly.Memory;

const heapBytesInitial = memory.buffer.byteLength;

const smallData = new Uint8Array(64);
const smallDigest = encodeHex(
  stdCrypto.subtle.digestSync("BLAKE3", smallData.buffer),
);
const heapBytesAfterSmall = memory.buffer.byteLength;

const largeData = new Uint8Array(64_000_000);
const largeDigest = encodeHex(
  stdCrypto.subtle.digestSync("BLAKE3", largeData.buffer),
);
const heapBytesAfterLarge = memory.buffer.byteLength;

// deno-lint-ignore no-console
console.log(JSON.stringify({
  heapBytesInitial,
  smallDigest,
  heapBytesAfterSmall,
  largeDigest,
  heapBytesAfterLarge,
}));
