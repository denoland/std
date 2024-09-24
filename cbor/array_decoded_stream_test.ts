// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals } from "@std/assert";
import { random } from "./_common_test.ts";
import { CborArrayDecodedStream } from "./array_decoded_stream.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborSequenceDecoderStream } from "./sequence_decoder_stream.ts";

Deno.test("CborSequenceDecoderStream() decoding Arrays", async () => {
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
