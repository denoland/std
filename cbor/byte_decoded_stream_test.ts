// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import { random } from "./_common_test.ts";
import { CborByteDecodedStream } from "./byte_decoded_stream.ts";
import { CborByteEncoderStream } from "./byte_encoder_stream.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborSequenceDecoderStream } from "./sequence_decoder_stream.ts";

Deno.test("CborSequenceDecoderStream() decoding Indefinite Length Byte String", async () => {
  const inputSize = 10;

  const reader = CborByteEncoderStream.from([
    new Uint8Array(inputSize),
    new Uint8Array(inputSize * 2),
    new Uint8Array(inputSize * 3),
  ]).readable.pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborByteDecodedStream);
  assertEquals(await Array.fromAsync(value), [
    new Uint8Array(inputSize),
    new Uint8Array(inputSize * 2),
    new Uint8Array(inputSize * 3),
  ]);

  assert((await reader.read()).done === true);
  reader.releaseLock();
});

Deno.test("CborSequenceDecoderStream() decoding large Definite Length Byte String", async () => {
  // Uint8Array needs to be 2 ** 32 bytes+ to be decoded via a CborByteDecodedStream.
  const size = random(2 ** 32, 2 ** 33);

  const reader = ReadableStream.from([encodeCbor(new Uint8Array(size))])
    .pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborByteDecodedStream);
  assertEquals(concat(await Array.fromAsync(value)).length, size);

  assert((await reader.read()).done === true);
  reader.releaseLock();
});
