// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import {
  CborArrayEncoderStream,
  CborByteEncoderStream,
  CborMapEncoderStream,
  type CborMapInputStream,
  CborTextEncoderStream,
  type CborType,
  encodeCbor,
} from "./mod.ts";
import { CborSequenceEncoderStream } from "./encode_stream.ts";

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
    ...strings.map((x) => encodeCbor(x)),
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
