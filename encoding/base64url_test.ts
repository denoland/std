// Copyright 2018-2023 the Deno authors. All rights reserved. MIT license.

import { assertEquals, assertThrows } from "../assert/mod.ts";
import { decodeBase64Url, encodeBase64Url } from "./base64url.ts";

const testsetString = [
  ["", ""],
  ["ß", "w58"],
  ["f", "Zg"],
  ["fo", "Zm8"],
  ["foo", "Zm9v"],
  ["foob", "Zm9vYg"],
  ["fooba", "Zm9vYmE"],
  ["foobar", "Zm9vYmFy"],
  [">?>d?ß", "Pj8-ZD_Dnw"],
];

const testsetBinary = testsetString.map(([str, b64]) => [
  new TextEncoder().encode(str),
  b64,
]) as Array<[Uint8Array, string]>;

const testsetInvalid = [
  "Pj8/ZD+Dnw",
  "PDw/Pz8+Pg",
  "Pj8/ZD+Dnw==",
  "PDw/Pz8+Pg==",
];

Deno.test("encodeBase64Url() encodes string", () => {
  for (const [input, output] of testsetString) {
    assertEquals(encodeBase64Url(input), output);
  }
});

Deno.test("encodeBase64Url() encodes binary", () => {
  for (const [input, output] of testsetBinary) {
    assertEquals(encodeBase64Url(input), output);
  }
});

Deno.test("decodeBase64Url() decodes binary", () => {
  for (const [input, output] of testsetBinary) {
    assertEquals(decodeBase64Url(output), input);
  }
});

Deno.test("decodeBase64Url() throws on invalid input", () => {
  for (const invalidb64url of testsetInvalid) {
    assertThrows(
      () => decodeBase64Url(invalidb64url),
      TypeError,
      "invalid character",
    );
  }
});

Deno.test("decodeBase64Url() throws on illegal base64url string", () => {
  const testsetIllegalBase64url = [
    "w58De",
    "Zm9vYmFyy",
    "DPj8-ZD_DnwEg",
    "SGVsbG8gV29ybGQ-_",
  ];

  for (const illegalBase64url of testsetIllegalBase64url) {
    assertThrows(
      () => decodeBase64Url(illegalBase64url),
      TypeError,
      "Illegal base64url string!",
    );
  }
});
