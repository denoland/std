// Copyright 2018-2026 the Deno authors. MIT license.

import { decode } from "./_common_decode.ts";
import type { CborType } from "./types.ts";

/**
 * Decodes a CBOR-encoded {@link Uint8Array} into the JavaScript equivalent
 * values represented as a {@link CborType}.
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 *
 * **Limitations:**
 * - While CBOR does support map keys of any type, this
 * implementation only supports map keys being of type {@link string}, and will
 * throw if detected decoding otherwise.
 * - This decoder will throw if duplicate map keys are detected. This behaviour
 * differentiates from {@link CborSequenceDecoderStream}.
 *
 * **Notice:** This decoder handles the tag numbers 0, and 1 automatically, all
 * others returned are wrapped in a {@link CborTag<CborType>} instance.
 *
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { type CborType, decodeCbor, encodeCbor } from "@std/cbor";
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
 * const encodedMessage = encodeCbor(rawMessage);
 * const decodedMessage = decodeCbor(encodedMessage);
 *
 * assert(decodedMessage instanceof Array);
 * assertEquals(decodedMessage, rawMessage);
 * ```
 *
 * @param input The value to decode of type CBOR-encoded {@link Uint8Array}.
 * @returns A {@link CborType} representing the decoded data.
 */
export function decodeCbor(input: Uint8Array): CborType {
  if (!input.length) throw new RangeError("Cannot decode empty Uint8Array");
  return decode(input, 0)[0];
}
