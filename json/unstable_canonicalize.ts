// Copyright 2018-2026 the Deno authors. MIT license.
// This module is browser compatible.

import type { JsonPrimitive, JsonValue } from "./types.ts";

/**
 * Serializes a primitive JSON value (null, boolean, number, string) to its
 * canonical string representation per RFC 8785.
 */
function serializePrimitive(value: JsonPrimitive): string {
  // JSON.stringify handles null, boolean, and string correctly per RFC 8785
  if (typeof value !== "number") return JSON.stringify(value);

  // RFC 8785 Section 3.2.2.3: Numbers must conform to I-JSON (RFC 7493)
  if (!Number.isFinite(value)) {
    throw new TypeError(
      `Cannot canonicalize non-finite number: ${value} is not allowed in I-JSON`,
    );
  }
  // Handle -0 as "0" (RFC 8785 Section 3.2.2.3)
  if (Object.is(value, -0)) return "0";
  // ECMAScript Number-to-String for all other numbers
  return value.toString();
}

/**
 * Serializes an array to its canonical string representation.
 * Undefined elements become null (standard JSON behavior).
 */
function serializeArray(value: JsonValue[], ancestors: object[]): string {
  if (value.length === 0) return "[]";

  const parts: string[] = [];
  for (const elem of value) {
    parts.push(elem === undefined ? "null" : serializeValue(elem, ancestors));
  }
  return "[" + parts.join(",") + "]";
}

/**
 * Serializes an object to its canonical string representation.
 * Keys are sorted by UTF-16 code units (RFC 8785 Section 3.2.3).
 * Undefined values are skipped (standard JSON behavior, RFC 8785 Section 3.1).
 */
function serializeObject(
  value: { [key: string]: JsonValue | undefined },
  ancestors: object[],
): string {
  // Default sort uses UTF-16 code unit comparison per RFC 8785
  const keys = Object.keys(value).sort();

  const parts: string[] = [];
  for (const key of keys) {
    const propValue = value[key];
    if (propValue === undefined) continue;
    parts.push(
      JSON.stringify(key) + ":" + serializeValue(propValue, ancestors),
    );
  }

  return "{" + parts.join(",") + "}";
}

/**
 * Recursively serializes a JSON value to its canonical string representation.
 *
 * @param value The JSON value to serialize
 * @param ancestors Stack of ancestor objects for cycle detection
 */
function serializeValue(value: JsonValue, ancestors: object[] = []): string {
  if (value === null) return "null";
  if (typeof value !== "object") return serializePrimitive(value);

  // Circular reference detection: check if this object is an ancestor
  if (ancestors.includes(value)) {
    throw new TypeError("Converting circular structure to JSON");
  }
  ancestors.push(value);

  const result = Array.isArray(value)
    ? serializeArray(value, ancestors)
    : serializeObject(value, ancestors);

  ancestors.pop();
  return result;
}

/**
 * Serializes a JSON value to a canonical string per
 * {@link https://www.rfc-editor.org/rfc/rfc8785 | RFC 8785} JSON
 * Canonicalization Scheme (JCS).
 *
 * This produces a deterministic JSON string suitable for hashing or signing,
 * with object keys sorted lexicographically by UTF-16 code units and no
 * whitespace between tokens.
 *
 * Note: The input must be JSON-compatible data. Objects with `toJSON()` methods
 * (like `Date`) should be converted to their JSON representation first.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The JSON value to canonicalize.
 * @returns The canonical JSON string.
 *
 * @example Basic usage (RFC 8785 Appendix E inspired)
 * ```ts
 * import { canonicalize } from "@std/json/unstable-canonicalize";
 * import { assertEquals } from "@std/assert";
 *
 * // Keys are sorted lexicographically, no whitespace between tokens
 * const data = {
 *   time: "2019-01-28T07:45:10Z",
 *   big: "055",
 *   val: 3.5,
 * };
 * assertEquals(canonicalize(data), '{"big":"055","time":"2019-01-28T07:45:10Z","val":3.5}');
 * ```
 *
 * @example Number serialization (RFC 8785 Section 3.2.2.3)
 * ```ts
 * import { canonicalize } from "@std/json/unstable-canonicalize";
 * import { assertEquals } from "@std/assert";
 *
 * // Numbers follow ECMAScript serialization rules
 * assertEquals(canonicalize(10.0), "10");           // No unnecessary decimals
 * assertEquals(canonicalize(1e21), "1e+21");        // Scientific notation for large
 * assertEquals(canonicalize(0.0000001), "1e-7");    // Scientific notation for small
 * assertEquals(canonicalize(-0), "0");              // Negative zero becomes "0"
 * ```
 *
 * @example Key sorting by UTF-16 code units (RFC 8785 Section 3.2.3)
 * ```ts
 * import { canonicalize } from "@std/json/unstable-canonicalize";
 * import { assertEquals } from "@std/assert";
 *
 * // Keys sorted by UTF-16 code units: digits < uppercase < lowercase
 * const data = { a: 1, A: 2, "1": 3 };
 * assertEquals(canonicalize(data), '{"1":3,"A":2,"a":1}');
 * ```
 *
 * @throws {TypeError} If the value contains non-finite numbers (Infinity, -Infinity, NaN).
 * @throws {TypeError} If the value contains circular references.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc8785 | RFC 8785}
 */
export function canonicalize(value: JsonValue): string {
  return serializeValue(value);
}

/**
 * Serializes a JSON value to canonical UTF-8 bytes per
 * {@link https://www.rfc-editor.org/rfc/rfc8785 | RFC 8785} JSON
 * Canonicalization Scheme (JCS).
 *
 * This is equivalent to `new TextEncoder().encode(canonicalize(value))` and
 * is provided as a convenience for cryptographic operations that require
 * byte input.
 *
 * @experimental **UNSTABLE**: New API, yet to be vetted.
 *
 * @param value The JSON value to canonicalize.
 * @returns The canonical JSON as UTF-8 bytes.
 *
 * @example Creating a verifiable hash
 * ```ts
 * import { canonicalizeToBytes } from "@std/json/unstable-canonicalize";
 * import { encodeHex } from "@std/encoding/hex";
 * import { assertEquals } from "@std/assert";
 *
 * // Create a deterministic hash of JSON data for verification
 * const payload = { action: "transfer", amount: 100, to: "alice" };
 * const bytes = canonicalizeToBytes(payload);
 * const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);
 * const hash = encodeHex(new Uint8Array(hashBuffer));
 *
 * // Same hash regardless of original key order
 * const reordered = { to: "alice", action: "transfer", amount: 100 };
 * const reorderedBytes = canonicalizeToBytes(reordered);
 * const reorderedHash = encodeHex(
 *   new Uint8Array(await crypto.subtle.digest("SHA-256", reorderedBytes)),
 * );
 *
 * assertEquals(hash, reorderedHash);
 * ```
 *
 * @throws {TypeError} If the value contains non-finite numbers (Infinity, -Infinity, NaN).
 * @throws {TypeError} If the value contains circular references.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc8785 | RFC 8785}
 */
export function canonicalizeToBytes(value: JsonValue): Uint8Array {
  return new TextEncoder().encode(canonicalize(value));
}
