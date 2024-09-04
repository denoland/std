// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { concat } from "@std/bytes";
import { CborEncoder, CborTag } from "./mod.ts";

function random(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start) + start);
}

Deno.test("CborEncoder() encoding undefined", () => {
  assertEquals(
    new CborEncoder().encode(undefined),
    new Uint8Array([0b111_10111]),
  );
});

Deno.test("CborEncoder() encoding null", () => {
  assertEquals(new CborEncoder().encode(null), new Uint8Array([0b111_10110]));
});

Deno.test("CborEncoder() encoding true", () => {
  assertEquals(new CborEncoder().encode(true), new Uint8Array([0b111_10101]));
});

Deno.test("CborEncoder() encoding false", () => {
  assertEquals(new CborEncoder().encode(false), new Uint8Array([0b111_10100]));
});

Deno.test("CborEncoder() encoding numbers as Uint", () => {
  const encoder = new CborEncoder();

  let num: number | bigint = random(0, 24);
  assertEquals(encoder.encode(num), new Uint8Array([0b000_00000 + num]));

  num = random(24, 2 ** 8);
  assertEquals(encoder.encode(num), new Uint8Array([0b000_11000, num]));

  num = random(2 ** 8, 2 ** 16);
  assertEquals(
    encoder.encode(num),
    new Uint8Array([0b000_11001, num >> 8 & 0xFF, num & 0xFF]),
  );

  num = random(2 ** 16, 2 ** 32);
  assertEquals(
    encoder.encode(num),
    new Uint8Array([
      0b000_11010,
      num >> 24 & 0xFF,
      num >> 16 & 0xFF,
      num >> 8 & 0xFF,
      num & 0xFF,
    ]),
  );

  // JavaScript fails at correctly bit-wising this many bits as a number.
  num = BigInt(Number.MAX_SAFE_INTEGER);
  assertEquals(
    encoder.encode(Number.MAX_SAFE_INTEGER),
    new Uint8Array(
      [
        0b000_11011,
        num >> 56n & 0xFFn,
        num >> 48n & 0xFFn,
        num >> 40n & 0xFFn,
        num >> 32n & 0xFFn,
        num >> 24n & 0xFFn,
        num >> 16n & 0xFFn,
        num >> 8n & 0xFFn,
        num & 0xFFn,
      ].map((x) => Number(x)),
    ),
  );
});

Deno.test("CborEncoder() encoding numbers as Int", () => {
  const num = -random(1, 24); // -0 === 0
  assertEquals(
    new CborEncoder().encode(num),
    new Uint8Array([0b001_00000 + (-num - 1)]),
  );
});

Deno.test("CborEncoder() encoding numbers as Float", () => {
  const num = Math.random() * 2 ** 32;
  const view = new DataView(new ArrayBuffer(8));
  view.setFloat64(0, num);
  assertEquals(
    new CborEncoder().encode(num),
    concat([new Uint8Array([0b111_11011]), new Uint8Array(view.buffer)]),
  );
});

Deno.test("CborEncoder() encoding bigints as Uint", () => {
  const encoder = new CborEncoder();

  let num = BigInt(random(0, 24));
  assertEquals(
    encoder.encode(num),
    new Uint8Array([0b000_00000 + Number(num)]),
  );

  num = BigInt(random(24, 2 ** 8));
  assertEquals(encoder.encode(num), new Uint8Array([0b000_11000, Number(num)]));

  num = BigInt(random(2 ** 8, 2 ** 16));
  assertEquals(
    encoder.encode(num),
    new Uint8Array([
      0b000_11001,
      Number(num >> 8n & 0xFFn),
      Number(num & 0xFFn),
    ]),
  );

  num = BigInt(random(2 ** 16, 2 ** 32));
  assertEquals(
    encoder.encode(num),
    new Uint8Array([
      0b000_11010,
      Number(num >> 24n & 0xFFn),
      Number(num >> 16n & 0xFFn),
      Number(num >> 8n & 0xFFn),
      Number(num & 0xFFn),
    ]),
  );

  num = BigInt(random(2 ** 32, 2 ** 64));
  assertEquals(
    encoder.encode(num),
    new Uint8Array([
      0b000_11011,
      Number(num >> 56n & 0xFFn),
      Number(num >> 48n & 0xFFn),
      Number(num >> 40n & 0xFFn),
      Number(num >> 32n & 0xFFn),
      Number(num >> 24n & 0xFFn),
      Number(num >> 16n & 0xFFn),
      Number(num >> 8n & 0xFFn),
      Number(num & 0xFFn),
    ]),
  );
});

Deno.test("CborEncoder() encoding bigints as Int", () => {
  const num = -BigInt(random(1, 24)); // -0 === 0
  assertEquals(
    new CborEncoder().encode(num),
    new Uint8Array([0b001_00000 + Number(-num - 1n)]),
  );
});

Deno.test("CborEncoder() encoding strings", () => {
  const encoder = new CborEncoder();
  const decoder = new TextDecoder();

  let bytes = new Uint8Array(random(0, 24)).map((_) => random(97, 123)); // Range: `a` - `z`
  assertEquals(
    encoder.encode(decoder.decode(bytes)),
    new Uint8Array([0b011_00000 + bytes.length, ...bytes]),
  );

  bytes = new Uint8Array(random(24, 2 ** 8)).map((_) => random(97, 123)); // Range: `a` - `z`
  assertEquals(
    encoder.encode(decoder.decode(bytes)),
    new Uint8Array([0b011_11000, bytes.length, ...bytes]),
  );

  bytes = new Uint8Array(random(2 ** 8, 2 ** 16)).map((_) => random(97, 123)); // Range: `a` - `z`
  assertEquals(
    encoder.encode(decoder.decode(bytes)),
    new Uint8Array([
      0b011_11001,
      bytes.length >> 8 & 0xFF,
      bytes.length & 0xFF,
      ...bytes,
    ]),
  );

  bytes = new Uint8Array(random(2 ** 16, 2 ** 17)).map((_) => random(97, 123)); // Range: `a` - `z`
  assertEquals(
    encoder.encode(decoder.decode(bytes)),
    new Uint8Array([
      0b011_11010,
      bytes.length >> 24 & 0xFF,
      bytes.length >> 16 & 0xFF,
      bytes.length >> 8 & 0xFF,
      bytes.length & 0xFF,
      ...bytes,
    ]),
  );

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("CborEncoder() encoding Uint8Arrays", () => {
  const encoder = new CborEncoder();

  let bytes = new Uint8Array(random(0, 24));
  assertEquals(
    encoder.encode(bytes),
    new Uint8Array([0b010_00000 + bytes.length, ...bytes]),
  );

  bytes = new Uint8Array(random(24, 2 ** 8));
  assertEquals(
    encoder.encode(bytes),
    new Uint8Array([0b010_11000, bytes.length, ...bytes]),
  );

  bytes = new Uint8Array(random(2 ** 8, 2 ** 16));
  assertEquals(
    encoder.encode(bytes),
    new Uint8Array([
      0b010_11001,
      bytes.length >> 8 & 0xFF,
      bytes.length & 0xFF,
      ...bytes,
    ]),
  );

  bytes = new Uint8Array(random(2 ** 16, 2 ** 17));
  assertEquals(
    encoder.encode(bytes),
    new Uint8Array([
      0b010_11010,
      bytes.length >> 24 & 0xFF,
      bytes.length >> 16 & 0xFF,
      bytes.length >> 8 & 0xFF,
      bytes.length & 0xFF,
      ...bytes,
    ]),
  );

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("CborEncoder() encoding Dates", () => {
  const encoder = new CborEncoder();
  const date = new Date();
  assertEquals(
    encoder.encode(date),
    new Uint8Array([0b110_00001, ...encoder.encode(date.getTime() / 1000)]),
  );
});

Deno.test("CborEncoder() encoding arrays", () => {
  const encoder = new CborEncoder();

  let array = new Array(random(0, 24)).fill(0);
  assertEquals(
    encoder.encode(array),
    new Uint8Array([
      0b100_00000 + array.length,
      ...array.map((x) => [...encoder.encode(x)]).flat(),
    ]),
  );

  array = new Array(random(24, 2 ** 8)).fill(0);
  assertEquals(
    encoder.encode(array),
    new Uint8Array([
      0b100_11000,
      array.length,
      ...array.map((x) => [...encoder.encode(x)]).flat(),
    ]),
  );

  array = new Array(random(2 ** 8, 2 ** 16)).fill(0);
  assertEquals(
    encoder.encode(array),
    new Uint8Array([
      0b100_11001,
      array.length >> 8 & 0xFF,
      array.length & 0xFF,
      ...array.map((x) => [...encoder.encode(x)]).flat(),
    ]),
  );

  array = new Array(random(2 ** 16, 2 ** 17)).fill(0);
  assertEquals(
    encoder.encode(array),
    new Uint8Array([
      0b100_11010,
      array.length >> 24 & 0xFF,
      array.length >> 16 & 0xFF,
      array.length >> 8 & 0xFF,
      array.length & 0xFF,
      ...array.map((x) => [...encoder.encode(x)]).flat(),
    ]),
  );

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("CborEncoder() encoding objects", () => {
  const encoder = new CborEncoder();

  let pairs = random(0, 24);
  let entries: [string, number][] = new Array(pairs).fill(0).map((
    _,
    i,
  ) => [i.toString(), i]);
  assertEquals(
    encoder.encode(Object.fromEntries(entries)),
    new Uint8Array([
      0b101_00000 + pairs,
      ...entries.map(([k, v]) => [...encoder.encode(k), ...encoder.encode(v)])
        .flat(),
    ]),
  );

  pairs = random(24, 2 ** 8);
  entries = new Array(pairs).fill(0).map((_, i) => [i.toString(), i]);
  assertEquals(
    encoder.encode(Object.fromEntries(entries)),
    new Uint8Array([
      0b101_11000,
      pairs,
      ...entries.map(([k, v]) => [...encoder.encode(k), ...encoder.encode(v)])
        .flat(),
    ]),
  );

  pairs = random(2 ** 8, 2 ** 16);
  entries = new Array(pairs).fill(0).map((_, i) => [i.toString(), i]);
  assertEquals(
    encoder.encode(Object.fromEntries(entries)),
    new Uint8Array([
      0b101_11001,
      pairs >> 8 & 0xFF,
      pairs & 0xFF,
      ...entries.map(([k, v]) => [...encoder.encode(k), ...encoder.encode(v)])
        .flat(),
    ]),
  );

  // Can't test the next two bracket up due to JavaScript limitations.
});

Deno.test("CborEncoder() encoding CborTag()", () => {
  const bytes = new Uint8Array(random(0, 24)).map((_) => random(0, 256));
  assertEquals(
    new CborEncoder().encode(new CborTag(2, bytes)),
    new Uint8Array([0b110_00010, 0b010_00000 + bytes.length, ...bytes]),
  );
});
