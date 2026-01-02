// Copyright 2018-2026 the Deno authors. MIT license.

import { decode } from "./_common_decode.ts";
import type { CborType } from "./types.ts";

/**
 * Decodes a CBOR-sequence-encoded {@link Uint8Array} into the JavaScript
 * equivalent values represented as a {@link CBorType} array.
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * **Limitations:**
 * - While CBOR does support map keys of any type, this implementation only
 * supports map keys being of type {@link string}, and will throw if detected
 * decoding otherwise.
 * - This decoder will throw an error if duplicate keys are detected.
 *
 * **Notice:** This decoder handles the tag numbers 0, and 1 automatically, all
 * others returned are wrapped in a {@link CborTag<CborType>} instance.
 *
 * @example Usage
 * ```ts
 * import { assertEquals } from "@std/assert";
 * import { type CborType, decodeCborSequence, encodeCborSequence } from "@std/cbor";
 *
 * const rawMessage = [
 *   "Hello World",
 *   35,
 *   0.5,
 *   false,
 *   -1,
 *   null,
 *   Uint8Array.from([0, 1, 2, 3]),
 *   new Date(),
 *   new Map<CborType, CborType>([[1, 2], ['3', 4], [[5], { a: 6 }]]),
 * ];
 *
 * const encodedMessage = encodeCborSequence(rawMessage);
 * const decodedMessage = decodeCborSequence(encodedMessage);
 *
 * assertEquals(decodedMessage, rawMessage);
 * ```
 *
 * @param input The value to decode of type CBOR-sequence-encoded
 * {@link Uint8Array}.
 * @returns A {@link CborType} array representing the decoded data.
 */

export function decodeCborSequence(input: Uint8Array): CborType[] {
  const output: CborType[] = [];
  let offset = 0;
  while (offset < input.length) {
    const x = decode(input, offset);
    output.push(x[0]);
    offset = x[1];
  }
  return output;
}
