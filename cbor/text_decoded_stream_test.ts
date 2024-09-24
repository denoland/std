// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals } from "@std/assert";
import { random } from "./_common_test.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborSequenceDecoderStream } from "./sequence_decoder_stream.ts";
import { CborTextDecodedStream } from "./text_decoded_stream.ts";
import { CborTextEncoderStream } from "./text_encoder_stream.ts";

Deno.test("CborSequenceDecoderStream() decoding Indefinite Length Text String", async () => {
  const inputSize = 10;

  const reader = CborTextEncoderStream.from([
    "a".repeat(inputSize),
    "b".repeat(inputSize * 2),
    "c".repeat(inputSize * 3),
  ]).readable.pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborTextDecodedStream);
  assertEquals(await Array.fromAsync(value), [
    "a".repeat(inputSize),
    "b".repeat(inputSize * 2),
    "c".repeat(inputSize * 3),
  ]);

  assert((await reader.read()).done === true);
  reader.releaseLock();
});

Deno.test("CborSequenceDecoderStream() decoding large Definite Text Byte String", async () => {
  // Strings need to be 2 ** 16 bytes+ to be decoded via a CborTextDecodedStream.
  const size = random(2 ** 16, 2 ** 17);

  const reader = ReadableStream.from([
    encodeCbor(
      new TextDecoder().decode(new Uint8Array(size).fill("a".charCodeAt(0))),
    ),
  ])
    .pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborTextDecodedStream);
  assertEquals((await Array.fromAsync(value)).join(""), "a".repeat(size));

  assert((await reader.read()).done === true);
  reader.releaseLock();
});
