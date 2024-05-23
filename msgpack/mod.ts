// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.

/**
 * MessagePack is an efficient binary serialization format that is language
 * agnostic. It is like JSON, but generally produces much smaller payloads.
 * [Learn more about MessagePack](https://msgpack.org/).
 *
 * This module provides functions to encode and decode MessagePack.
 *
 * ```ts
 * import { decode, encode } from "@std/msgpack";
 * import { assertEquals } from "@std/assert"
 *
 * const obj = {
 *   str: "deno",
 *   arr: [1, 2, 3],
 *   bool: true,
 *   nil: null,
 *   map: {
 *     foo: "bar"
 *   }
 * };
 *
 * const encoded = encode(obj);
 * console.log(encoded); // Uint8Array(42) [...]
 *
 * const decoded = decode(encoded);
 * assertEquals(decoded, obj);
 * ```
 *
 * MessagePack supports encoding and decoding the following types:
 *
 * - `number`
 * - `bigint`
 * - `string`
 * - `boolean`
 * - `null`
 * - `Uint8Array`
 * - arrays of values of these types
 * - objects with string or number keys, and values of these types
 *
 * @module
 */

export * from "./decode.ts";
export * from "./encode.ts";
