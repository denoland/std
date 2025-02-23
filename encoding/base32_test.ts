// Copyright 2018-2025 the Deno authors. MIT license.
import { assertEquals, assertExists, assertThrows } from "@std/assert";
import { decodeBase32, encodeBase32 } from "./base32.ts";

// Test vectors from https://www.rfc-editor.org/rfc/rfc4648.html#section-10
const testCases = [
  ["", ""],
  ["f", "MY======"],
  ["fo", "MZXQ===="],
  ["foo", "MZXW6==="],
  ["foob", "MZXW6YQ="],
  ["fooba", "MZXW6YTB"],
  ["foobar", "MZXW6YTBOI======"],
] as const;

Deno.test({
  name: "encodeBase32()",
  fn() {
    for (const [bin, b32] of testCases) {
      assertEquals(encodeBase32(bin), b32);
    }
  },
});

Deno.test({
  name: "decodeBase32()",
  fn() {
    for (const [bin, b32] of testCases) {
      assertEquals(decodeBase32(b32), new TextEncoder().encode(bin));
    }
  },
});

Deno.test({
  name: "decodeBase32() throws on bad length",
  fn() {
    assertThrows(
      () => decodeBase32("OOO=="),
      Error,
      "Invalid Character",
    );
  },
});

Deno.test({
  name: "decodeBase32() throws on bad padding",
  fn() {
    assertThrows(
      () => decodeBase32("5HXR334AQYAAAA=="),
      Error,
      "Invalid Character",
    );
  },
});

Deno.test({
  name: "encodeBase32() encodes very long text",
  fn() {
    const data = "a".repeat(16400);
    assertExists(encodeBase32(data));
  },
});
