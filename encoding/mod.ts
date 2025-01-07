// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Utilities for encoding and decoding common formats like hex, base64, and varint.
 *
 * ```ts
 * import { encodeBase64, decodeBase64 } from "@std/encoding";
 * import { assertEquals } from "@std/assert";
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
export * from "./varint.ts";
