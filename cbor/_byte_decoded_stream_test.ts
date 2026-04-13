// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import { CborByteDecodedStream } from "./_byte_decoded_stream.ts";
import { random } from "./_common_test.ts";
import { CborByteEncoderStream } from "./byte_encoder_stream.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborSequenceDecoderStream } from "./sequence_decoder_stream.ts";
import { CborSequenceEncoderStream } from "./sequence_encoder_stream.ts";

Deno.test("CborByteDecodedStream() consuming indefinite length byte string", async () => {
  const size = random(0, 24);

  const reader = CborByteEncoderStream.from([
    new Uint8Array(size),
    new Uint8Array(size * 2),
    new Uint8Array(size * 3),
  ]).readable.pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborByteDecodedStream);
  assertEquals(await Array.fromAsync(value), [
    new Uint8Array(size),
    new Uint8Array(size * 2),
    new Uint8Array(size * 3),
  ]);

  assert((await reader.read()).done === true);
  reader.releaseLock();
});

Deno.test("CborByteDecodedStream() consuming large definite length byte string", async () => {
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

Deno.test("CborByteDecodedStream() being cancelled", async () => {
  const size = random(0, 24);

  const reader = ReadableStream.from([
    CborByteEncoderStream.from([
      new Uint8Array(size),
      new Uint8Array(size * 2),
      new Uint8Array(size * 3),
    ]),
    0,
  ])
    .pipeThrough(new CborSequenceEncoderStream())
    .pipeThrough(new CborSequenceDecoderStream()).getReader();

  {
    const { done, value } = await reader.read();
    assert(done === false);
    assert(value instanceof CborByteDecodedStream);
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
