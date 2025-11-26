// Copyright 2018-2025 the Deno authors. MIT license.

/**
 * Concise Binary Object Representation (CBOR) is a binary data serialization
 * format optimized for compactness and efficiency. It is designed to encode a
 * wide range of data types, including integers, strings, arrays, and maps, in a
 * space-efficient manner.
 * [RFC 8949 - Concise Binary Object Representation (CBOR)](https://datatracker.ietf.org/doc/html/rfc8949)
 * spec.
 *
 * ### Limitations
 * - This implementation only supports the encoding and decoding of
 * "Text String" keys.
 * - This implementation encodes decimal numbers with 64 bits. It takes no
 * effort to figure out if the decimal can be encoded with 32 or 16 bits.
 * - When decoding, integers with a value below 2 ** 32 will be of type
 * {@link number}, with all larger integers being of type {@link bigint}.
 *
 * Functions and classes may have more specific limitations listed.
 *
 * ```ts
 * import { assert, assertEquals } from "@std/assert";
 * import { decodeCbor, encodeCbor } from "@std/cbor";
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
export * from "./array_encoder_stream.ts";
export * from "./byte_encoder_stream.ts";
export * from "./decode_cbor_sequence.ts";
export * from "./decode_cbor.ts";
export * from "./encode_cbor_sequence.ts";
export * from "./encode_cbor.ts";
export * from "./map_encoder_stream.ts";
export * from "./sequence_decoder_stream.ts";
export * from "./sequence_encoder_stream.ts";
export * from "./tag.ts";
export * from "./text_encoder_stream.ts";
export * from "./types.ts";
