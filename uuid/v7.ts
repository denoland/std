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
   * 10 bytes of random value to use in the UUID.
   * Generally you should not need to set these, but it can be useful for testing.
   *
   * @internal
   */
  random?: Uint8Array;
}

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
  if (
    options.timestamp !== undefined && (
      !Number.isInteger(options.timestamp) || options.timestamp < 0
    )
  ) {
    throw new Error(
      `Cannot generate UUID as timestamp must be a non-negative integer: timestamp ${options.timestamp}`,
    );
  }
  const timestamp = BigInt(options.timestamp ?? Date.now());
  view.setBigUint64(0, timestamp << 16n);
  if (options.random) {
    bytes.set(options.random, 6);
  } else {
    crypto.getRandomValues(bytes.subarray(6));
  }
  // Version (4 bits) Occupies bits 48 through 51 of octet 6.
  view.setUint8(6, (view.getUint8(6) & 0b00001111) | 0b01110000);
  // Variant (2 bits) Occupies bits 64 through 65 of octet 8.
  view.setUint8(8, (view.getUint8(8) & 0b00111111) | 0b10000000);
  return bytesToUuid(bytes);
}
