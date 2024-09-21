// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * CBOR is a binary serialisation format that is language agnostic. It is like
 * JSON, but allows more a much more wide range of values, and supports
 * streaming. This implementation is based off the
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 * spec.
 *
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { decodeCbor, encodeCbor } from "./mod.ts";
 *
 * const rawMessage = "I am a raw Message!";
 *
 * const encodedMessage = encodeCbor(rawMessage);
 * const decodedMessage = decodeCbor(encodedMessage);
 *
 * assert(typeof decodedMessage === "string");
 * assertEquals(decodedMessage, rawMessage);
 * ```
 *
 * @module
 */
export * from "./decode.ts";
export * from "./encode.ts";
export * from "./decode_stream.ts";
export * from "./encode_stream.ts";
