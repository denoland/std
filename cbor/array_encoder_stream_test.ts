// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import { random } from "./_common_test.ts";
import { CborArrayEncoderStream } from "./array_encoder_stream.ts";
import { encodeCbor } from "./encode_cbor.ts";

Deno.test("CborArrayEncoderStream() correctly encoding", async () => {
  const arrays = [random(0, 2 ** 32)];

  const expectedOutput = concat([
    new Uint8Array([0b100_11111]),
    ...arrays.map((x) => encodeCbor(x)),
    new Uint8Array([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      ReadableStream.from(arrays).pipeThrough(new CborArrayEncoderStream()),
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborArrayEncoderStream.from() correctly encoding", async () => {
  const arrays = [random(0, 2 ** 32)];

  const expectedOutput = concat([
    new Uint8Array([0b100_11111]),
    ...arrays.map((x) => encodeCbor(x)),
    new Uint8Array([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      CborArrayEncoderStream.from(arrays).readable,
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});
