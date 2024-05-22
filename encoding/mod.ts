// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * Utilities for encoding and decoding common formats like hex, base64, and varint.
 *
 * This module is browser compatible.
 *
 * ```ts
 * import { encodeBase64, decodeBase64 } from "@std/encoding";
 * import { assertEquals } from "@std/assert/assert-equals";
 *
 * const foobar = new TextEncoder().encode("foobar");
 * assertEquals(encodeBase64(foobar), "Zm9vYmFy");
 * assertEquals(decodeBase64("Zm9vYmFy"), foobar);
 * ```
 *
 * @module
 */

export * from "./ascii85.ts";
export * from "./base32.ts";
export * from "./base58.ts";
export * from "./base64.ts";
export * from "./base64url.ts";
export * from "./hex.ts";
// TODO: change to * after varint decode/encode functions are removed
export {
  decodeVarint,
  decodeVarint32,
  encodeVarint,
  MaxUInt64,
  MaxVarIntLen32,
  MaxVarIntLen64,
} from "./varint.ts";
