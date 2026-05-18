// Copyright 2018-2026 the Deno authors. MIT license.

import type { CborArrayDecodedStream } from "./_array_decoded_stream.ts";
import type { CborByteDecodedStream } from "./_byte_decoded_stream.ts";
import type { CborMapDecodedStream } from "./_map_decoded_stream.ts";
import type { CborTextDecodedStream } from "./_text_decoded_stream.ts";
import type { CborArrayEncoderStream } from "./array_encoder_stream.ts";
import type { CborByteEncoderStream } from "./byte_encoder_stream.ts";
import type { CborMapEncoderStream } from "./map_encoder_stream.ts";
import type { CborTag } from "./tag.ts";
import type { CborTextEncoderStream } from "./text_encoder_stream.ts";

/**
 * This type specifies the primitive types that the implementation can
 * encode/decode into/from.
 */
export type CborPrimitiveType =
  | undefined
  | null
  | boolean
  | number
  | bigint
  | string
  | Uint8Array
  | Date;

/**
 * This type specifies the encodable and decodable values for
 * {@link encodeCbor}, {@link decodeCbor}, {@link encodeCborSequence}, and
 * {@link decodeCborSequence}.
 *
 * The encoder functions also accept {@link CborInputType}, which permits
 * `readonly` arrays, `ReadonlyMap`, and `readonly` index signatures.
 */
export type CborType =
  | CborPrimitiveType
  | CborTag<CborType>
  | Map<CborType, CborType>
  | CborType[]
  | {
    [k: string]: CborType;
  };

/**
 * Readonly-friendly input type for {@link encodeCbor} and
 * {@link encodeCborSequence}. Lets you pass `as const` literals,
 * `ReadonlyMap`s, and frozen arrays without casting.
 *
 * @example Usage
 * ```ts
 * import { encodeCbor } from "@std/cbor";
 *
 * const data = {
 *   a: 1,
 *   b: { c: 2n },
 *   d: [3, { e: 4 }],
 * } as const;
 *
 * encodeCbor(data);
 * ```
 */
export type CborInputType =
  | CborPrimitiveType
  | CborTag<CborInputType>
  | ReadonlyMap<CborInputType, CborInputType>
  | readonly CborInputType[]
  | {
    readonly [k: string]: CborInputType;
  };

/**
 * Specifies the encodable value types for the {@link CborSequenceEncoderStream}
 * and {@link CborArrayEncoderStream}.
 *
 * Arrays and index signatures are `readonly` so `as const` literals work
 * without casting.
 */
export type CborStreamInput =
  | CborPrimitiveType
  | CborTag<CborStreamInput>
  | readonly CborStreamInput[]
  | { readonly [k: string]: CborStreamInput }
  | CborByteEncoderStream
  | CborTextEncoderStream
  | CborArrayEncoderStream
  | CborMapEncoderStream;

/**
 * Specifies the structure of input for the {@link CborMapEncoderStream}.
 */
export type CborMapStreamInput = [string, CborStreamInput];

/**
 * Specifies the decodable value types for the {@link CborSequenceDecoderStream}
 * and {@link CborMapDecodedStream}.
 */
export type CborStreamOutput =
  | CborPrimitiveType
  | CborTag<CborStreamOutput>
  | CborByteDecodedStream
  | CborTextDecodedStream
  | CborArrayDecodedStream
  | CborMapDecodedStream;

/**
 * Specifies the structure of the output for the {@link CborMapDecodedStream}.
 */
export type CborMapStreamOutput = [string, CborStreamOutput];
