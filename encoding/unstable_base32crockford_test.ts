// Test cases copied from https://github.com/LinusU/base32-encode/blob/master/test.js
// Copyright (c) 2016-2017 Linus Unnebäck. MIT license.
// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { assertEquals, assertExists, assertThrows } from "@std/assert";
import {
  decodeBase32Crockford,
  encodeBase32Crockford,
} from "./unstable_base32crockford.ts";

// Test vectors from https://www.rfc-editor.org/rfc/rfc4648.html#section-10
const testCases = [
  ["", ""],
  ["f", "CR======"],
  ["fo", "CSQG===="],
  ["foo", "CSQPY==="],
  ["foob", "CSQPYRG="],
  ["fooba", "CSQPYRK1"],
  ["foobar", "CSQPYRK1E8======"],
] as const;

Deno.test({
  name: "encodeBase32()",
  fn() {
    for (const [bin, b32] of testCases) {
      assertEquals(encodeBase32Crockford(bin), b32);
    }
  },
});

Deno.test({
  name: "decodeBase32()",
  fn() {
    for (const [bin, b32] of testCases) {
      assertEquals(decodeBase32Crockford(b32), new TextEncoder().encode(bin));
    }
  },
});

Deno.test({
  name: "decodeBase32() throws on bad length",
  fn() {
    assertThrows(
      () => decodeBase32Crockford("OOOO=="),
      Error,
      "Cannot decode base32 string as the length must be a multiple of 8: received length 6",
    );
  },
});

Deno.test({
  name: "decodeBase32() throws on bad padding",
  fn() {
    assertThrows(
      () => decodeBase32Crockford("5HXR334AQYAAAA=="),
      Error,
      "Invalid pad length",
    );
  },
});

Deno.test({
  name: "encodeBase32() encodes very long text",
  fn() {
    const data = "a".repeat(16400);
    assertExists(encodeBase32Crockford(data));
  },
});
