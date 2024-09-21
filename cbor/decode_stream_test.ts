// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assert, assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import {
  CborArrayDecodedStream,
  CborByteDecodedStream,
  CborByteEncoderStream,
  CborMapDecodedStream,
  type CborMapOutputStream,
  CborSequenceDecoderStream,
  CborTag,
  CborTextDecodedStream,
  CborTextEncoderStream,
  encodeCbor,
  encodeCborSequence,
} from "./mod.ts";

function random(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start) + start);
}

Deno.test("CborSequenceDecoderStream() decoding CborPrimitiveType", async () => {
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

Deno.test("CborSequenceDecoderStream() decoding Indefinite Length Byte String", async () => {
  const inputSize = 10;

  const reader = CborByteEncoderStream.from([
    new Uint8Array(inputSize),
    new Uint8Array(inputSize * 2),
    new Uint8Array(inputSize * 3),
  ]).readable.pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborByteDecodedStream);
  assertEquals(await Array.fromAsync(value), [
    new Uint8Array(inputSize),
    new Uint8Array(inputSize * 2),
    new Uint8Array(inputSize * 3),
  ]);

  assert((await reader.read()).done === true);
  reader.releaseLock();
});

Deno.test("CborSequenceDecoderStream() decoding large Definite Length Byte String", async () => {
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

Deno.test("CborSequenceDecoderStream() decoding Indefinite Length Text String", async () => {
  const inputSize = 10;

  const reader = CborTextEncoderStream.from([
    "a".repeat(inputSize),
    "b".repeat(inputSize * 2),
    "c".repeat(inputSize * 3),
  ]).readable.pipeThrough(new CborSequenceDecoderStream()).getReader();

  const { done, value } = await reader.read();
  assert(done === false);
  assert(value instanceof CborTextDecodedStream);
  assertEquals(await Array.fromAsync(value), [
    "a".repeat(inputSize),
    "b".repeat(inputSize * 2),
    "c".repeat(inputSize * 3),
  ]);

  assert((await reader.read()).done === true);
  reader.releaseLock();
});

Deno.test("CborSequenceDecoderStream() decoding large Definite Text Byte String", async () => {
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

Deno.test("CborSequenceDecoderStream() decoding Objects", async () => {
  const size = random(0, 24);
  const entries = new Array(size).fill(0).map((_, i) =>
    [String.fromCharCode(97 + i), i] satisfies CborMapOutputStream
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

Deno.test("CborSequenceDecoderStream() decoding CborTag()", async () => {
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
