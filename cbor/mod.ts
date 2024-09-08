// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/**
 * CBOR is a binary serialisation format that is language agnostic. It is like
 * JSON, but allows more a much more wide range of values, and supports
 * streaming. This implementation is based off the
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 * spec.
 *
 * ```ts no-assert
 * import { encodeCbor } from "@std/cbor";
 *
 * console.log(encodeCbor(5));
 * ```
 *
 * @module
 */
export * from "./decode.ts";
export * from "./encode.ts";
export * from "./encode_stream.ts";
