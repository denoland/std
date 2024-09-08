// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "@std/assert";
import { CborDecoder, CborTag, encodeCbor } from "./mod.ts";

function random(start: number, end: number): number {
  return Math.floor(Math.random() * (end - start) + start);
}

Deno.test("CborDecoder() decoding undefined", () => {
  assertEquals(
    new CborDecoder().decode(encodeCbor(undefined)),
    undefined,
  );
});

Deno.test("CborDecoder() decoding null", () => {
  assertEquals(new CborDecoder().decode(encodeCbor(null)), null);
});

Deno.test("CborDecoder() decoding true", () => {
  assertEquals(new CborDecoder().decode(encodeCbor(true)), true);
});

Deno.test("CborDecoder() decoding false", () => {
  assertEquals(
    new CborDecoder().decode(encodeCbor(false)),
    false,
  );
});

Deno.test("CborDecoder() decoding integers", () => {
  const decoder = new CborDecoder();

  let num = random(0, 24);
  assertEquals(decoder.decode(encodeCbor(num)), num);
  assertEquals(decoder.decode(encodeCbor(BigInt(num))), num);

  num = random(24, 2 ** 8);
  assertEquals(decoder.decode(encodeCbor(num)), num);
  assertEquals(decoder.decode(encodeCbor(BigInt(num))), num);

  num = random(2 ** 8, 2 ** 16);
  assertEquals(decoder.decode(encodeCbor(num)), num);
  assertEquals(decoder.decode(encodeCbor(BigInt(num))), num);

  num = random(2 ** 16, 2 ** 32);
  assertEquals(decoder.decode(encodeCbor(num)), num);
  assertEquals(decoder.decode(encodeCbor(BigInt(num))), num);

  num = random(2 ** 32, 2 ** 64);
  assertEquals(decoder.decode(encodeCbor(num)), BigInt(num));
  assertEquals(decoder.decode(encodeCbor(BigInt(num))), BigInt(num));
});

Deno.test("CborDecoder() decoding strings", () => {
  const decoder = new CborDecoder();
  const textDecoder = new TextDecoder();

  let text = textDecoder.decode(
    new Uint8Array(random(0, 24)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decoder.decode(encodeCbor(text)), text);

  text = textDecoder.decode(
    new Uint8Array(random(24, 2 ** 8)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decoder.decode(encodeCbor(text)), text);

  text = textDecoder.decode(
    new Uint8Array(random(2 ** 8, 2 ** 16)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decoder.decode(encodeCbor(text)), text);

  text = textDecoder.decode(
    new Uint8Array(random(2 ** 16, 2 ** 17)).map((_) => random(97, 123)),
  ); // Range: `a` - `z`
  assertEquals(decoder.decode(encodeCbor(text)), text);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("CborDecoder() decoding Uint8Arrays", () => {
  const decoder = new CborDecoder();

  let bytes = new Uint8Array(random(0, 24)).map((_) => random(0, 256));
  assertEquals(decoder.decode(encodeCbor(bytes)), bytes);

  bytes = new Uint8Array(random(24, 2 ** 8)).map((_) => random(0, 256));
  assertEquals(decoder.decode(encodeCbor(bytes)), bytes);

  bytes = new Uint8Array(random(2 ** 8, 2 ** 16)).map((_) => random(0, 256));
  assertEquals(decoder.decode(encodeCbor(bytes)), bytes);

  bytes = new Uint8Array(random(2 ** 16, 2 ** 17)).map((_) => random(0, 256));
  assertEquals(decoder.decode(encodeCbor(bytes)), bytes);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("CborDecoder() decoding Dates", () => {
  const date = new Date();
  assertEquals(new CborDecoder().decode(encodeCbor(date)), date);
});

Deno.test("CborDecoder() decoding arrays", () => {
  const decoder = new CborDecoder();

  let array = new Array(random(0, 24)).fill(0).map((_) => random(0, 2 ** 32));
  assertEquals(decoder.decode(encodeCbor(array)), array);

  array = new Array(random(24, 2 ** 8)).fill(0).map((_) => random(0, 2 ** 32));
  assertEquals(decoder.decode(encodeCbor(array)), array);

  array = new Array(random(2 ** 8, 2 ** 16)).fill(0).map((_) =>
    random(0, 2 ** 32)
  );
  assertEquals(decoder.decode(encodeCbor(array)), array);

  array = new Array(random(2 ** 16, 2 ** 17)).fill(0).map((_) =>
    random(0, 2 ** 32)
  );
  assertEquals(decoder.decode(encodeCbor(array)), array);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("CborDecoder() decoding objects", () => {
  const decoder = new CborDecoder();

  let pairs = random(0, 24);
  let object = Object.fromEntries(
    new Array(pairs).fill(0).map((_, i) => [i, i]),
  );
  assertEquals(decoder.decode(encodeCbor(object)), object);

  pairs = random(24, 2 ** 8);
  object = Object.fromEntries(new Array(pairs).fill(0).map((_, i) => [i, i]));
  assertEquals(decoder.decode(encodeCbor(object)), object);

  pairs = random(2 ** 8, 2 ** 16);
  object = Object.fromEntries(new Array(pairs).fill(0).map((_, i) => [i, i]));
  assertEquals(decoder.decode(encodeCbor(object)), object);

  pairs = random(2 ** 16, 2 ** 17);
  object = Object.fromEntries(new Array(pairs).fill(0).map((_, i) => [i, i]));
  assertEquals(decoder.decode(encodeCbor(object)), object);

  // Can't test the next bracket up due to JavaScript limitations.
});

Deno.test("CborDecoder() decoding CborTag()", () => {
  const tag = new CborTag(
    2,
    new Uint8Array(random(0, 24)).map((_) => random(0, 256)),
  );
  assertEquals(
    new CborDecoder().decode(encodeCbor(tag)),
    tag,
  );
});
