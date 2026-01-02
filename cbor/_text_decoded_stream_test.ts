// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { random } from "./_common_test.ts";
import { CborTextDecodedStream } from "./_text_decoded_stream.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborSequenceDecoderStream } from "./sequence_decoder_stream.ts";
import { CborTextEncoderStream } from "./text_encoder_stream.ts";
import { CborSequenceEncoderStream } from "./sequence_encoder_stream.ts";

Deno.test("CborTextDecodedStream() consuming indefinite length text string", async () => {
  const size = random(0, 24);

  const reader = CborTextEncoderStream.from([
    "a".repeat(size),
    "b".repeat(size * 2),
    "c".repeat(size * 3),
  ]).readable.pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborTextDecodedStream);
  assertEquals(await Array.fromAsync(value), [
    "a".repeat(size),
    "b".repeat(size * 2),
    "c".repeat(size * 3),
  ]);

  assert((await reader.read()).done === true);
  reader.releaseLock();
});

Deno.test("CborTextDecodedStream() consuming large definite length text string", async () => {
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

Deno.test("CborTextDecodedStream() being cancelled", async () => {
  const size = random(0, 24);

  const reader = ReadableStream.from([
    CborTextEncoderStream.from([
      "a".repeat(size),
      "b".repeat(size * 2),
      "c".repeat(size * 3),
    ]),
    0,
  ])
    .pipeThrough(new CborSequenceEncoderStream())
    .pipeThrough(new CborSequenceDecoderStream()).getReader();

  {
    const { done, value } = await reader.read();
    assert(done === false);
    assert(value instanceof CborTextDecodedStream);
    await value.cancel();
  }

  {
    const { done, value } = await reader.read();
    assert(done === false);
    assert(typeof value === "number");
    assertEquals(value, 0);
  }

  assert((await reader.read()).done === true);
  reader.releaseLock();
});
