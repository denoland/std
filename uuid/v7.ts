// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

import { bytesToUuid } from "./_common.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/**
 * Determines whether a string is a valid
 * {@link https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7 | UUIDv7}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param id UUID value.
 *
 * @returns `true` if the string is a valid UUIDv7, otherwise `false`.
 *
 * @example Usage
 * ```ts
 * import { validate } from "@std/uuid/v7";
 * import { assert, assertFalse } from "@std/assert";
 *
 * assert(validate("017f22e2-79b0-7cc3-98c4-dc0c0c07398f"));
 * assertFalse(validate("fac8c1e0-ad1a-4204-a0d0-8126ae84495d"));
 * ```
 */
export function validate(id: string): boolean {
  return UUID_RE.test(id);
}

/**
 * Options for {@linkcode generate}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 */
export interface GenerateOptions {
  /**
   * Unix epoch timestamp in milliseconds.
   *
   * @default {Date.now()}
   */
  timestamp?: number;
  /**
   * Random values to use in the UUID.
   * Generally you should not need to set these, but it can be useful for testing.
   *
   * @internal
   */
  random?: {
    /** 12 bits of randomness. */
    a: Uint8Array;
    /** 62 bits of randomness. */
    b: Uint8Array;
  };
}

const version = 0b0111;
const variant = 0b10;

/**
 * Generates a {@link https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7 | UUIDv7}.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param options Options for generating the UUIDv7.
 * @returns Returns a UUIDv7 string
 *
 * @example Usage
 * ```ts
 * import { generate, validate } from "@std/uuid/v7";
 * import { assert } from "@std/assert";
 *
 * const uuid = generate();
 * assert(validate(uuid));
 * ```
 */
export function generate(options: GenerateOptions = {}): string {
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  // Unix timestamp in milliseconds (truncated to 48 bits)
  const timestamp = BigInt(options.timestamp ?? Date.now());
  view.setUint32(0, Number(timestamp >> 16n) & 0xffffffff);
  view.setUint16(4, Number(timestamp & 0xffffn));
  // Version (4 bits) & Random (12 bits)
  const randA = options.random?.a ?? crypto.getRandomValues(new Uint8Array(2));
  view.setUint8(6, randA[0]! & 0x0f | version << 4);
  view.setUint8(7, randA[1]!);
  // Variant (2 bits) & Random (62 bits)
  const randB = options.random?.b ?? crypto.getRandomValues(new Uint8Array(8));
  view.setUint8(8, randB[0]! & 0x3f | variant << 6);
  view.setUint8(9, randB[1]!);
  view.setUint8(10, randB[2]!);
  view.setUint8(11, randB[3]!);
  view.setUint8(12, randB[4]!);
  view.setUint8(13, randB[5]!);
  view.setUint8(14, randB[6]!);
  view.setUint8(15, randB[7]!);
  return bytesToUuid(bytes);
}
