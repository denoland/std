// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.
import { crypto, type DigestAlgorithm } from "./mod.ts";

const encoder = new TextEncoder();

/**
 * Creates a hash from a string or binary data, taking care of the boilerplate required for most cases.
 *
 * @example <caption>Before:</caption>
 * ```ts
 * import { crypto } from "https://deno.land/std@$STD_VERSION/crypto/crypto.ts";
 *
 * const encoder = new TextEncoder();
 *
 * const hash = await crypto.subtle.digest("SHA-1", encoder.encode("Hello, world!"));
 * ```
 *
 * @example <caption>After:</caption>
 * ```ts
 * import { createHash } from "https://deno.land/std@$STD_VERSION/crypto/_util.ts";
 *
 * const hash = await createHash("SHA-1", "Hello, world!");
 * ```
 * @private
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
