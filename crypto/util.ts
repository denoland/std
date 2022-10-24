// Copyright 2018-2022 the Deno authors. All rights reserved. MIT license.
import { crypto, type DigestAlgorithm } from "./mod.ts";
import * as hex from "../encoding/hex.ts";
import * as base64 from "../encoding/base64.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Creates a hash from a string or binary data, taking care of the boilerplate required for most cases.
 *
 * @example <caption>Before:</caption>
 * ```ts
 * import { crypto } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";
 *
 * const encoder = new TextEncoder();
 *
 * const hash = await crypto.subtle.digest("SHA-1", encoder.encode("Hello, world!"));
 * ```
 *
 * @example <caption>After:</caption>
 * ```ts
 * import { createHash } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";
 *
 * const hash = await createHash("SHA-1", "Hello, world!");
 * ```
 */
export async function createHash(
  algorithm: DigestAlgorithm,
  data:
    | string
    | BufferSource
    | AsyncIterable<BufferSource>
    | Iterable<BufferSource>,
): Promise<ArrayBuffer> {
  if (typeof data === "string") {
    data = encoder.encode(data);
  }
  return await crypto.subtle.digest(algorithm, data);
}

/**
 * Converts a hash to a string with a given encoding.
 * @example
 * ```ts
 * import { crypto, toHashString } from "https://deno.land/std@$STD_VERSION/crypto/mod.ts";
 *
 * const hash = await crypto.subtle.digest("SHA-384", new TextEncoder().encode("You hear that Mr. Anderson?"));
 *
 * // Hex encoding by default
 * console.log(toHashString(hash));
 *
 * // Or with base64 encoding
 * console.log(toHashString(hash, "base64"));
 * ```
 */
export function toHashString(
  hash: ArrayBuffer,
  encoding: "hex" | "base64" = "hex",
): string {
  switch (encoding) {
    case "hex":
      return decoder.decode(hex.encode(new Uint8Array(hash)));
    case "base64":
      return base64.encode(hash);
  }
}
