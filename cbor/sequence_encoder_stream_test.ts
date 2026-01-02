// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import { random } from "./_common_test.ts";
import { CborArrayEncoderStream } from "./array_encoder_stream.ts";
import { CborByteEncoderStream } from "./byte_encoder_stream.ts";
import { encodeCbor } from "./encode_cbor.ts";
import { CborMapEncoderStream } from "./map_encoder_stream.ts";
import { CborSequenceEncoderStream } from "./sequence_encoder_stream.ts";
import { CborTag } from "./tag.ts";
import { CborTextEncoderStream } from "./text_encoder_stream.ts";

Deno.test("CborSequenceEncoderStream() correctly encoding CborPrimitiveType", async () => {
  const input = [
    undefined,
    null,
    true,
    false,
    random(0, 24),
    BigInt(random(0, 24)),
    "a".repeat(random(0, 24)),
    new Uint8Array(random(0, 24)),
    new Date(),
  ];

  const expectedOutput = concat(input.map((x) => encodeCbor(x)));

  const actualOutput = concat(
    await Array.fromAsync(
      ReadableStream.from(input).pipeThrough(new CborSequenceEncoderStream()),
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborSequenceEncoderStream() correctly encoding streams", async () => {
  // Inputs should be identical. We need two of them as the contents will be consumed when calculating expectedOutput and actualOutput.
  const input1 = [
    CborByteEncoderStream.from([new Uint8Array(10), new Uint8Array(20)]),
    CborTextEncoderStream.from(["a".repeat(10), "b".repeat(20)]),
    CborArrayEncoderStream.from([10, 20]),
    CborMapEncoderStream.from([["a", 0], ["b", 1], ["c", 2], ["d", 3]]),
  ];
  const input2 = [
    CborByteEncoderStream.from([new Uint8Array(10), new Uint8Array(20)]),
    CborTextEncoderStream.from(["a".repeat(10), "b".repeat(20)]),
    CborArrayEncoderStream.from([10, 20]),
    CborMapEncoderStream.from([["a", 0], ["b", 1], ["c", 2], ["d", 3]]),
  ];

  const expectedOutput = concat(
    await Promise.all(
      input1.map(async (stream) =>
        concat(await Array.fromAsync(stream.readable))
      ),
    ),
  );

  const actualOutput = concat(
    await Array.fromAsync(
      CborSequenceEncoderStream.from(input2).readable,
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborSequenceEncoderStream() correctly encoding arrays", async () => {
  const input = [
    new Array(random(1, 24)).fill(0),
    new Array(random(24, 2 ** 8)).fill(0),
    new Array(random(2 ** 8, 2 ** 16)).fill(0),
    new Array(random(2 ** 16, 2 ** 17)).fill(0),
  ];

  const expectedOutput = concat(input.map((x) => encodeCbor(x)));

  const actualOutput = concat(
    await Array.fromAsync(
      CborSequenceEncoderStream.from(input).readable,
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborSequenceEncoderStream() correctly encoding objects", async () => {
  const input = [
    Object.fromEntries(
      new Array(random(10, 20)).fill(0).map((
        _,
        i,
      ) => [String.fromCharCode(97 + i), false]),
    ),
  ];

  const expectedOutput = concat(input.map((x) => encodeCbor(x)));

  const actualOutput = concat(
    await Array.fromAsync(
      CborSequenceEncoderStream.from(input).readable,
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborSequenceEncoderStream() correctly encoding CborTag()", async () => {
  const input = [
    new CborTag(0, 0),
    new CborTag(1, 1),
    new CborTag(2, 2),
    new CborTag(3, 3),
  ];

  const expectedOutput = concat(input.map((x) => encodeCbor(x)));

  const actualOutput = concat(
    await Array.fromAsync(
      CborSequenceEncoderStream.from(input).readable,
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});
