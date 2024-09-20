// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import {
  CborArrayEncoderStream,
  CborByteEncoderStream,
  CborMapEncoderStream,
  type CborMapInputStream,
  CborSequenceEncoderStream,
  CborTag,
  CborTextEncoderStream,
  type CborType,
  encodeCbor,
} from "./mod.ts";

function random(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start) + start);
}

Deno.test("CborByteEncoderStream()", async () => {
  const bytes = [
    new Uint8Array(random(0, 24)),
    new Uint8Array(random(24, 2 ** 8)),
    new Uint8Array(random(2 ** 8, 2 ** 16)),
    new Uint8Array(random(2 ** 16, 2 ** 17)),
  ];

  const expectedOutput = concat([
    new Uint8Array([0b010_11111]),
    ...bytes.map((x) => encodeCbor(x)),
    new Uint8Array([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      ReadableStream.from(bytes).pipeThrough(new CborByteEncoderStream()),
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborTextEncoderStream()", async () => {
  const strings = [
    "a".repeat(random(0, 24)),
    "a".repeat(random(24, 2 ** 8)),
    "a".repeat(random(2 ** 8, 2 ** 16)),
    "a".repeat(random(2 ** 16, 2 ** 17)),
  ];

  const expectedOutput = concat([
    new Uint8Array([0b011_11111]),
    ...strings.filter((x) => x).map((x) => encodeCbor(x)),
    new Uint8Array([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      ReadableStream.from(strings).pipeThrough(new CborTextEncoderStream()),
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborArrayEncoderStream()", async () => {
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

Deno.test("CborMapEncoderStream()", async () => {
  const maps: CborMapInputStream[] = [["a", random(0, 2 ** 32)]];

  const expectedOutput = concat([
    new Uint8Array([0b101_11111]),
    ...maps.map(([k, v]) => [encodeCbor(k), encodeCbor(v as CborType)]).flat(),
    new Uint8Array([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      ReadableStream.from(maps).pipeThrough(new CborMapEncoderStream()),
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborSequenceEncoderStream()", async () => {
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

Deno.test("CborByteEncoderStream.from()", async () => {
  const bytes = [
    new Uint8Array(random(0, 24)),
    new Uint8Array(random(24, 2 ** 8)),
    new Uint8Array(random(2 ** 8, 2 ** 16)),
    new Uint8Array(random(2 ** 16, 2 ** 17)),
  ];

  const expectedOutput = concat([
    Uint8Array.from([0b010_11111]),
    ...bytes.map((x) => encodeCbor(x)),
    Uint8Array.from([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      CborByteEncoderStream.from(bytes).readable,
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborTextEncoderStream.from()", async () => {
  const strings = [
    "a".repeat(random(0, 24)),
    "a".repeat(random(24, 2 ** 8)),
    "a".repeat(random(2 ** 8, 2 ** 16)),
    "a".repeat(random(2 ** 16, 2 ** 17)),
  ];

  const expectedOutput = concat([
    new Uint8Array([0b011_11111]),
    ...strings.filter((x) => x).map((x) => encodeCbor(x)),
    new Uint8Array([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      CborTextEncoderStream.from(strings).readable,
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborArrayEncoderStream.from()", async () => {
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

Deno.test("CborMapEncoderStream.from()", async () => {
  const maps: CborMapInputStream[] = [["a", random(0, 2 ** 32)]];

  const expectedOutput = concat([
    new Uint8Array([0b101_11111]),
    ...maps.map(([k, v]) => [encodeCbor(k), encodeCbor(v as CborType)]).flat(),
    new Uint8Array([0b111_11111]),
  ]);

  const actualOutput = concat(
    await Array.fromAsync(
      CborMapEncoderStream.from(maps).readable,
    ),
  );

  assertEquals(actualOutput, expectedOutput);
});

Deno.test("CborSequenceEncoderStream() accepting the other streams", async () => {
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

Deno.test("CborSequenceEncoderStream() accepting CborInputStream[]", async () => {
  const input = [
    new Array(random(0, 24)).fill(0),
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

Deno.test("CborSequenceEncoderStream() accepting { [k: string]: CborInputStream }", async () => {
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

Deno.test("CborSequenceEncoderStream() accepting CborTag()", async () => {
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
