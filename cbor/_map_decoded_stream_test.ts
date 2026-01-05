// Copyright 2018-2026 the Deno authors. MIT license.

import { assert, assertEquals } from "@std/assert";
import { random } from "./_common_test.ts";
import { CborMapDecodedStream } from "./_map_decoded_stream.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborSequenceDecoderStream } from "./sequence_decoder_stream.ts";
import type { CborMapStreamOutput } from "./types.ts";

Deno.test("CborMapDecodedStream() being consumed", async () => {
  const size = random(0, 24);
  const entries = new Array(size).fill(0).map((_, i) =>
    [String.fromCharCode(97 + i), i] satisfies CborMapStreamOutput
  );

  const reader = ReadableStream.from([encodeCbor(Object.fromEntries(entries))])
    .pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborMapDecodedStream);
  assertEquals(await Array.fromAsync(value), entries);

  assert((await reader.read()).done === true);
  reader.releaseLock();
});

Deno.test("CborMapDecodedStream() being cancelled", async () => {
  const size = random(0, 24);
  const entries = new Array(size).fill(0).map((_, i) =>
    [String.fromCharCode(97 + i), i] satisfies CborMapStreamOutput
  );

  const reader = ReadableStream.from([
    encodeCbor(Object.fromEntries(entries)),
    encodeCbor(0),
  ])
    .pipeThrough(new CborSequenceDecoderStream()).getReader();

  {
    const { done, value } = await reader.read();
    assert(done === false);
    assert(value instanceof CborMapDecodedStream);
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
