// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { CborTag, decodeCbor, encodeCbor } from "./mod.ts";

function random(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start) + start);
}

Deno.test("decodeCbor() decoding undefined", () => {
  assertEquals(decodeCbor(encodeCbor(undefined)), undefined);
});

Deno.test("decodeCbor() decoding null", () => {
  assertEquals(decodeCbor(encodeCbor(null)), null);
});

Deno.test("decodeCbor() decoding true", () => {
  assertEquals(decodeCbor(encodeCbor(true)), true);
});

Deno.test("decodeCbor() decoding false", () => {
  assertEquals(decodeCbor(encodeCbor(false)), false);
});

Deno.test("decodeCbor() decoding integers", () => {
  let num = random(0, 24);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = random(24, 2 ** 8);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = random(2 ** 8, 2 ** 16);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = random(2 ** 16, 2 ** 32);
  assertEquals(decodeCbor(encodeCbor(num)), num);
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), num);

  num = random(2 ** 32, 2 ** 64);
  assertEquals(decodeCbor(encodeCbor(num)), BigInt(num));
  assertEquals(decodeCbor(encodeCbor(BigInt(num))), BigInt(num));
});

Deno.test("decodeCbor() decoding strings", () => {
  const textDecoder = new TextDecoder();

  let text = textDecoder.decode(
    new Uint8Array(random(0, 24)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decodeCbor(encodeCbor(text)), text);

  text = textDecoder.decode(
    new Uint8Array(random(24, 2 ** 8)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decodeCbor(encodeCbor(text)), text);

  text = textDecoder.decode(
    new Uint8Array(random(2 ** 8, 2 ** 16)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decodeCbor(encodeCbor(text)), text);

  text = textDecoder.decode(
    new Uint8Array(random(2 ** 16, 2 ** 17)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decodeCbor(encodeCbor(text)), text);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("decodeCbor() decoding Uint8Arrays", () => {
  let bytes = new Uint8Array(random(0, 24)).map((_) => random(0, 256));
  assertEquals(decodeCbor(encodeCbor(bytes)), bytes);

  bytes = new Uint8Array(random(24, 2 ** 8)).map((_) => random(0, 256));
  assertEquals(decodeCbor(encodeCbor(bytes)), bytes);

  bytes = new Uint8Array(random(2 ** 8, 2 ** 16)).map((_) => random(0, 256));
  assertEquals(decodeCbor(encodeCbor(bytes)), bytes);

  bytes = new Uint8Array(random(2 ** 16, 2 ** 17)).map((_) => random(0, 256));
  assertEquals(decodeCbor(encodeCbor(bytes)), bytes);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("decodeCbor() decoding Dates", () => {
  const date = new Date();
  assertEquals(decodeCbor(encodeCbor(date)), date);
});

Deno.test("decodeCbor() decoding arrays", () => {
  let array = new Array(random(0, 24)).fill(0).map((_) => random(0, 2 ** 32));
  assertEquals(decodeCbor(encodeCbor(array)), array);

  array = new Array(random(24, 2 ** 8)).fill(0).map((_) => random(0, 2 ** 32));
  assertEquals(decodeCbor(encodeCbor(array)), array);

  array = new Array(random(2 ** 8, 2 ** 16)).fill(0).map((_) =>
    random(0, 2 ** 32)
  );
  assertEquals(decodeCbor(encodeCbor(array)), array);

  array = new Array(random(2 ** 16, 2 ** 17)).fill(0).map((_) =>
    random(0, 2 ** 32)
  );
  assertEquals(decodeCbor(encodeCbor(array)), array);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("decodeCbor() decoding objects", () => {
  let pairs = random(0, 24);
  let object = Object.fromEntries(
    new Array(pairs).fill(0).map((_, i) => [i, i]),
  );
  assertEquals(decodeCbor(encodeCbor(object)), object);

  pairs = random(24, 2 ** 8);
  object = Object.fromEntries(new Array(pairs).fill(0).map((_, i) => [i, i]));
  assertEquals(decodeCbor(encodeCbor(object)), object);

  pairs = random(2 ** 8, 2 ** 16);
  object = Object.fromEntries(new Array(pairs).fill(0).map((_, i) => [i, i]));
  assertEquals(decodeCbor(encodeCbor(object)), object);

  pairs = random(2 ** 16, 2 ** 17);
  object = Object.fromEntries(new Array(pairs).fill(0).map((_, i) => [i, i]));
  assertEquals(decodeCbor(encodeCbor(object)), object);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("decodeCbor() decoding CborTag()", () => {
  const tag = new CborTag(
    2,
    new Uint8Array(random(0, 24)).map((_) => random(0, 256)),
  );
  assertEquals(decodeCbor(encodeCbor(tag)), tag);
});
