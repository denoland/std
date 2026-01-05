// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

/**
 * Functions for working with UUID Version 7 strings.
 *
 * UUID Version 7 is defined in {@link https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7 | RFC 9562}.
 *
 * ```ts
 * import { generate, validate, extractTimestamp } from "@std/uuid/v7";
 * import { assert, assertEquals } from "@std/assert";
 *
 * const uuid = generate();
 * assert(validate(uuid));
 * assertEquals(extractTimestamp("017f22e2-79b0-7cc3-98c4-dc0c0c07398f"), 1645557742000);
 * ```
 *
 * @module
 */

import { bytesToUuid } from "./_common.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/**
 * Determines whether a string is a valid
 * {@link https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7 | UUIDv7}.
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
 * Generates a {@link https://www.rfc-editor.org/rfc/rfc9562.html#section-5.7 | UUIDv7}.
 *
 * @throws {RangeError} If the timestamp is not a non-negative integer.
 *
 * @param timestamp Unix Epoch timestamp in milliseconds.
 *
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
export function generate(timestamp: number = Date.now()): string {
  const bytes = new Uint8Array(16);
  const view = new DataView(bytes.buffer);
  // Unix timestamp in milliseconds (truncated to 48 bits)
  if (!Number.isInteger(timestamp) || timestamp < 0) {
    throw new RangeError(
      `Cannot generate UUID as timestamp must be a non-negative integer: timestamp ${timestamp}`,
    );
  }
  view.setBigUint64(0, BigInt(timestamp) << 16n);
  crypto.getRandomValues(bytes.subarray(6));
  // Version (4 bits) Occupies bits 48 through 51 of octet 6.
  view.setUint8(6, (view.getUint8(6) & 0b00001111) | 0b01110000);
  // Variant (2 bits) Occupies bits 64 through 65 of octet 8.
  view.setUint8(8, (view.getUint8(8) & 0b00111111) | 0b10000000);
  return bytesToUuid(bytes);
}

/**
 * Extracts the timestamp from a UUIDv7.
 *
 * @param uuid UUIDv7 string to extract the timestamp from.
 * @returns Returns the timestamp in milliseconds.
 *
 * @throws {TypeError} If the UUID is not a valid UUIDv7.
 *
 * @example Usage
 * ```ts
 * import { extractTimestamp } from "@std/uuid/v7";
 * import { assertEquals } from "@std/assert";
 *
 * const uuid = "017f22e2-79b0-7cc3-98c4-dc0c0c07398f";
 * const timestamp = extractTimestamp(uuid);
 * assertEquals(timestamp, 1645557742000);
 * ```
 */
export function extractTimestamp(uuid: string): number {
  if (!validate(uuid)) {
    throw new TypeError(
      `Cannot extract timestamp because the UUID is not a valid UUIDv7: uuid is "${uuid}"`,
    );
  }
  const timestampHex = uuid.slice(0, 8) + uuid.slice(9, 13);
  return parseInt(timestampHex, 16);
}
