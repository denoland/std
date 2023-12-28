// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals } from "../assert/mod.ts";
import { decodeBase64, encodeBase64 } from "./base64.ts";

const testsetString = [
  ["", ""],
  ["ß", "w58="],
  ["f", "Zg=="],
  ["fo", "Zm8="],
  ["foo", "Zm9v"],
  ["foob", "Zm9vYg=="],
  ["fooba", "Zm9vYmE="],
  ["foobar", "Zm9vYmFy"],
];

const testsetBinary = testsetString.map(([str, b64]) => [
  new TextEncoder().encode(str),
  b64,
]) as Array<[Uint8Array, string]>;

Deno.test("encodeBase64() encodes string", () => {
  for (const [input, output] of testsetString) {
    assertEquals(encodeBase64(input), output);
  }
});

Deno.test("encodeBase64() encodes binary", () => {
  for (const [input, output] of testsetBinary) {
    assertEquals(encodeBase64(input), output);
  }
});

Deno.test("encodeBase64() encodes binary buffer", () => {
  for (const [input, output] of testsetBinary) {
    assertEquals(encodeBase64(input.buffer), output);
  }
});

Deno.test("decodeBase64() decodes binary", () => {
  for (const [input, output] of testsetBinary) {
    const outputBinary = decodeBase64(output);
    assertEquals(outputBinary, input);
  }
});
