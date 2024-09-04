// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * CBOR is a binary serialisation format that is language agnostic. It is like
 * JSON, but allows more a much more wide range of values, and supports
 * streaming. This implementation is based off the
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 * spec.
 *
 * @example Usage
 * ```ts no-assert
 * import { CborEncoder } from "@std/cbor";
 *
 * const encoder = new CborEncoder();
 * console.log(encoder.encode(5));
 * ```
 *
 * @module
 */
export * from "./decode.ts";
export * from "./encode.ts";
