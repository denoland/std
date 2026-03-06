// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { CborArrayDecodedStream } from "./_array_decoded_stream.ts";
import { random } from "./_common_test.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { encodeCborSequence } from "./encode_cbor_sequence.ts";
import { CborSequenceDecoderStream } from "./sequence_decoder_stream.ts";
import { CborTag } from "./tag.ts";

Deno.test("CborSequenceDecoderStream() correctly decoding CborPrimitiveType", async () => {
  const input = [
    undefined,
    null,
    true,
    false,
    Math.random() * 10,
    random(0, 24),
    -BigInt(random(2 ** 32, 2 ** 64)),
    "a".repeat(random(0, 24)),
    new Uint8Array(random(0, 24)),
    new Date(),
  ];

  assertEquals(
    await Array.fromAsync(
      ReadableStream.from([encodeCborSequence(input)]).pipeThrough(
        new CborSequenceDecoderStream(),
      ),
    ),
    input,
  );
});

Deno.test("CborSequenceDecoderStream() correctly decoding CborTag()", async () => {
  const tagNumber = 2; // Tag Number needs to be a value that will return a CborTag.
  const size = random(0, 24);

  const reader = ReadableStream.from([
    encodeCbor(new CborTag(tagNumber, new Array(size).fill(0))),
  ]).pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborTag);
  assertEquals(value.tagNumber, tagNumber);
  assert(value.tagContent instanceof CborArrayDecodedStream);
  assertEquals(
    await Array.fromAsync(value.tagContent),
    new Array(size).fill(0),
  );

  assert((await reader.read()).done === true);
  reader.releaseLock();
});
