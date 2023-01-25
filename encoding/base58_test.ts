// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../testing/asserts.ts";
import { decode, encode } from "./base58.ts";

const testSetString = [
  ["", ""],
  ["f", "2m"],
  ["ß", "FtS"],
  ["fo", "8o8"],
  ["foo", "bQbp"],
  ["foob", "3csAg9"],
  ["fooba", "CZJRhmz"],
  ["foobar", "t1Zv2yaZ"],
  ["Hello World!", "2NEpo7TZRRrLZSi2U"],
  [new Uint8Array([0, 0, 0, 40, 127, 180, 205]), "111233QC4"],
  [new Uint8Array([10, 0, 10]), "4MpV"],
];

const testSetBinary = testSetString.map(([data, b58]) => {
  if (typeof data === "string") {
    return [
      new TextEncoder().encode(data),
      b58,
    ];
  }

  return [data, b58];
}) as Array<[Uint8Array, string]>;

Deno.test("[encoding/base58] testBase58EncodeString", () => {
  for (const [input, output] of testSetString) {
    assertEquals(encode(input), output);
  }
});

Deno.test("[encoding/base58] testBase58EncodeBinary", () => {
  for (const [input, output] of testSetBinary) {
    assertEquals(encode(input), output);
  }
});

Deno.test("[encoding/base58] testBase58EncodeBinaryBuffer", () => {
  for (const [input, output] of testSetBinary) {
    assertEquals(encode(input.buffer), output);
  }
});

Deno.test("[encoding/base58] testBase58DecodeBinary", () => {
  for (const [input, output] of testSetBinary) {
    const outputBinary = decode(output);
    assertEquals(outputBinary, input);
  }
});

Deno.test("[encoding/base58] testBase58DecodeError", () => {
  assertThrows(
    () => decode("+2NEpo7TZRRrLZSi2U"),
    `Invalid base58 char at index 0 with value +`,
  );
});
