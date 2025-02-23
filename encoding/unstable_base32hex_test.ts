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
      assertEquals(decodeBase32Hex(b32), new TextEncoder().encode(bin), b32);
    }
  },
});

Deno.test({
  name: "decodeBase32Hex() throws on bad length",
  fn() {
    assertThrows(
      () => decodeBase32Hex("OOO=="),
      Error,
      "Invalid Character",
    );
  },
});

Deno.test({
  name: "decodeBase32Hex() throws on bad padding",
  fn() {
    assertThrows(
      () => decodeBase32Hex("5HXR334AQYAAAA=="),
      Error,
      "Invalid Character",
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
