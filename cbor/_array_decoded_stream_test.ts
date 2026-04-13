// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { CborArrayDecodedStream } from "./_array_decoded_stream.ts";
import { random } from "./_common_test.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborSequenceDecoderStream } from "./sequence_decoder_stream.ts";

Deno.test("CborArrayDecodedStream() being consumed", async () => {
  const size = random(0, 24);

  const reader = ReadableStream.from([encodeCbor(new Array(size).fill(0))])
    .pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborArrayDecodedStream);
  assertEquals(await Array.fromAsync(value), new Array(size).fill(0));

  assert((await reader.read()).done === true);
  reader.releaseLock();
});

Deno.test("CborArrayDecodedStream() being cancelled", async () => {
  const size = random(0, 24);
  const reader = ReadableStream.from([
    encodeCbor(new Array(size).fill(0)),
    encodeCbor(0),
  ])
    .pipeThrough(new CborSequenceDecoderStream()).getReader();

  {
    const { done, value } = await reader.read();
    assert(done === false);
    assert(value instanceof CborArrayDecodedStream);
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
