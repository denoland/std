// Test cases copied from https://github.com/LinusU/base32-encode/blob/master/test.js
// Copyright (c) 2016-2017 Linus Unnebäck. MIT license.
// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { decodeBase32Hex, encodeBase32Hex } from "./unstable_base32hex.ts";

// Test vectors from https://www.rfc-editor.org/rfc/rfc4648.html#section-10
const testCases = [
  ["", ""],
  ["f", "CO======"],
  ["fo", "CPNG===="],
  ["foo", "CPNMU==="],
  ["foob", "CPNMUOG="],
  ["fooba", "CPNMUOJ1"],
  ["foobar", "CPNMUOJ1E8======"],
] as const;

Deno.test({
  name: "encodeBase32Hex()",
  fn() {
    for (const [bin, b32] of testCases) {
      assertEquals(encodeBase32Hex(bin), b32);
    }
  },
});

Deno.test({
  name: "decodeBase32Hex()",
  fn() {
    for (const [bin, b32] of testCases) {
      assertEquals(decodeBase32Hex(b32), new TextEncoder().encode(bin));
    }
  },
});

Deno.test({
  name: "decodeBase32Hex() throws on bad length",
  fn() {
    assertThrows(
      () => decodeBase32Hex("OOOO=="),
      Error,
      "Cannot decode base32 string as the length must be a multiple of 8: received length 6",
    );
  },
});

Deno.test({
  name: "decodeBase32Hex() throws on bad padding",
  fn() {
    assertThrows(
      () => decodeBase32Hex("5HXR334AQYAAAA=="),
      Error,
      "Invalid pad length",
    );
  },
});

Deno.test({
  name: "encodeBase32Hex() encodes very long text",
  fn() {
    const data = "a".repeat(16400);
    assertExists(encodeBase32Hex(data));
  },
});
