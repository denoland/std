// Copyright 2018-2026 the Deno authors. MIT license.

import type { CborStreamInput, CborStreamOutput, CborType } from "./types.ts";

/**
 * Represents a CBOR tag, which pairs a tag number with content, used to convey
 * additional semantic information in CBOR-encoded data.
 * [CBOR Tags](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml).
 *
 * @example Usage
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { CborTag, decodeCbor, encodeCbor } from "@std/cbor";
 * import { decodeBase64Url, encodeBase64Url } from "@std/encoding";
 *
 * const rawMessage = new TextEncoder().encode("Hello World");
 *
 * const encodedMessage = encodeCbor(
 *   new CborTag(
 *     33, // TagNumber 33 specifies the tagContent must be a valid "base64url" "string".
 *     encodeBase64Url(rawMessage),
 *   ),
 * );
 *
 * const decodedMessage = decodeCbor(encodedMessage);
 *
 * assert(decodedMessage instanceof CborTag);
 * assert(typeof decodedMessage.tagContent === "string");
 * assertEquals(decodeBase64Url(decodedMessage.tagContent), rawMessage);
 * ```
 *
 * @typeParam T The type of the tag's content, which can be a
 * {@link CborType}, {@link CborStreamInput}, or {@link CborStreamOutput}.
 */
export class CborTag<T extends CborType | CborStreamInput | CborStreamOutput> {
  /**
   * A {@link number} or {@link bigint} representing the CBOR tag number, used
   * to identify the type of the tagged content.
   * [CBOR Tags](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml).
   *
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import { CborTag, decodeCbor, encodeCbor } from "@std/cbor";
   * import { decodeBase64Url, encodeBase64Url } from "@std/encoding";
   *
   * const rawMessage = new TextEncoder().encode("Hello World");
   *
   * const encodedMessage = encodeCbor(
   *   new CborTag(
   *     33, // TagNumber 33 specifies the tagContent must be a valid "base64url" "string".
   *     encodeBase64Url(rawMessage),
   *   ),
   * );
   *
   * const decodedMessage = decodeCbor(encodedMessage);
   *
   * assert(decodedMessage instanceof CborTag);
   * assert(typeof decodedMessage.tagContent === "string");
   * assertEquals(decodeBase64Url(decodedMessage.tagContent), rawMessage);
   * ```
   */
  tagNumber: number | bigint;
  /**
   * The content associated with the tag of type {@link T}.
   * [CBOR Tags](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml).
   *
   * @example Usage
   * ```ts
   * import { assert, assertEquals } from "@std/assert";
   * import { CborTag, decodeCbor, encodeCbor } from "@std/cbor";
   * import { decodeBase64Url, encodeBase64Url } from "@std/encoding";
   *
   * const rawMessage = new TextEncoder().encode("Hello World");
   *
   * const encodedMessage = encodeCbor(
   *   new CborTag(
   *     33, // TagNumber 33 specifies the tagContent must be a valid "base64url" "string".
   *     encodeBase64Url(rawMessage),
   *   ),
   * );
   *
   * const decodedMessage = decodeCbor(encodedMessage);
   *
   * assert(decodedMessage instanceof CborTag);
   * assert(typeof decodedMessage.tagContent === "string");
   * assertEquals(decodeBase64Url(decodedMessage.tagContent), rawMessage);
   * ```
   */
  tagContent: T;
  /**
   * Constructs a new instance.
   *
   * @param tagNumber A {@link number} or {@link bigint} representing the CBOR
   * tag number, used to identify the type of the tagged content.
   * @param tagContent The content associated with the tag of type {@link T}.
   */
  constructor(tagNumber: number | bigint, tagContent: T) {
    this.tagNumber = tagNumber;
    this.tagContent = tagContent;
  }
}
