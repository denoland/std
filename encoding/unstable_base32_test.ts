// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { concat } from "@std/bytes";
import {
  calcSizeBase32,
  decodeBase32,
  encodeBase32,
  encodeIntoBase32,
} from "./unstable_base32.ts";

const inputOutput: [string | ArrayBuffer, string, string, string][] = [
  ["", "", "", ""],
  ["A", "IE======", "84======", "84======"],
  ["AA", "IFAQ====", "850G====", "850G===="],
  ["AAA", "IFAUC===", "850K2===", "850M2==="],
  ["AAAA", "IFAUCQI=", "850K2G8=", "850M2G8="],
  ["AAAAA", "IFAUCQKB", "850K2GA1", "850M2GA1"],
  ["AAAAAA", "IFAUCQKBIE======", "850K2GA184======", "850M2GA184======"],
  [new Uint8Array(0).fill("A".charCodeAt(0)).buffer, "", "", ""],
  [
    new Uint8Array(1).fill("A".charCodeAt(0)).buffer,
    "IE======",
    "84======",
    "84======",
  ],
  [
    new Uint8Array(2).fill("A".charCodeAt(0)).buffer,
    "IFAQ====",
    "850G====",
    "850G====",
  ],
  [
    new Uint8Array(3).fill("A".charCodeAt(0)).buffer,
    "IFAUC===",
    "850K2===",
    "850M2===",
  ],
  [
    new Uint8Array(4).fill("A".charCodeAt(0)).buffer,
    "IFAUCQI=",
    "850K2G8=",
    "850M2G8=",
  ],
  [
    new Uint8Array(5).fill("A".charCodeAt(0)).buffer,
    "IFAUCQKB",
    "850K2GA1",
    "850M2GA1",
  ],
  [
    new Uint8Array(6).fill("A".charCodeAt(0)).buffer,
    "IFAUCQKBIE======",
    "850K2GA184======",
    "850M2GA184======",
  ],
];

Deno.test("encodeBase32()", () => {
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    assertEquals(
      encodeBase32(input.slice(0), { alphabet: "base32" }),
      base32,
      "Base32",
    );
    assertEquals(
      encodeBase32(input.slice(0), { alphabet: "base32hex" }),
      base32hex,
      "Base32Hex",
    );
    assertEquals(
      encodeBase32(input.slice(0), { alphabet: "base32crockford" }),
      base32crockford,
      "Base32Crockford",
    );
  }
});

Deno.test("encodeBase32() subarray", () => {
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (typeof input === "string") continue;

    const buffer = new Uint8Array(10);
    buffer.set(new Uint8Array(input), 10 - input.byteLength);

    assertEquals(
      encodeBase32(buffer.slice().subarray(10 - input.byteLength), {
        alphabet: "base32",
      }),
      base32,
      "Base32",
    );
    assertEquals(
      encodeBase32(buffer.slice().subarray(10 - input.byteLength), {
        alphabet: "base32hex",
      }),
      base32hex,
      "Base32Hex",
    );
    assertEquals(
      encodeBase32(
        buffer.slice().subarray(10 - input.byteLength),
        { alphabet: "base32crockford" },
      ),
      base32crockford,
      "Base32Crockford",
    );
  }
});

Deno.test("encodeBase32Into()", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (typeof input === "string") continue;

    for (
      const [output, alphabet] of [
        [concat([prefix, new TextEncoder().encode(base32)]), "base32"],
        [concat([prefix, new TextEncoder().encode(base32hex)]), "base32hex"],
        [
          concat([prefix, new TextEncoder().encode(base32crockford)]),
          "base32crockford",
        ],
      ] as const
    ) {
      const buffer = new Uint8Array(
        prefix.length + calcSizeBase32(input.byteLength),
      );
      buffer.set(prefix);

      encodeIntoBase32(
        input,
        buffer.subarray(prefix.length),
        { alphabet },
      );
      assertEquals(buffer, output, alphabet);
    }
  }
});

Deno.test("encodeBase32Into() with too small buffer", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input] of inputOutput) {
    if (typeof input === "string" || input.byteLength === 0) continue;

    for (
      const alphabet of ["base32", "base32hex", "base32crockford"] as const
    ) {
      const buffer = new Uint8Array(
        prefix.length + calcSizeBase32(input.byteLength) - 2,
      );
      buffer.set(prefix);

      assertThrows(
        () =>
          encodeIntoBase32(
            input,
            buffer.subarray(prefix.length),
            { alphabet },
          ),
        RangeError,
        "Cannot encode input as base32: Output too small",
        alphabet,
      );
    }
  }
});

Deno.test("decodeBase32()", () => {
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;
    const output = new TextEncoder().encode(input);

    assertEquals(
      decodeBase32(base32, { alphabet: "base32" }),
      output,
      "Base32",
    );
    assertEquals(
      decodeBase32(base32hex, { alphabet: "base32hex" }),
      output,
      "Base32Hex",
    );
    assertEquals(
      decodeBase32(base32crockford, { alphabet: "base32crockford" }),
      output,
      "Base32Crockford",
    );
  }
});

Deno.test("decodeBase32() invalid char after padding", () => {
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;
    if (base32[base32.length - 2] !== "=") continue;

    for (
      const [input, alphabet] of [
        [base32.substring(-1) + ".", "base32"],
        [base32hex.substring(-1) + ".", "base32hex"],
        [base32crockford.substring(-1) + ".", "base32crockford"],
      ] as const
    ) {
      assertThrows(
        () => decodeBase32(input, { alphabet }),
        TypeError,
        "Cannot decode input as base32: Invalid character (.)",
        alphabet,
      );
    }
  }
});

Deno.test("decodeBase32() invalid length", () => {
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;
    if (input.length === 4 || input.length === 2) continue;

    for (
      const [input, alphabet] of [
        [base32.replaceAll("=", "") + "A", "base32"],
        [base32hex.replaceAll("=", "") + "A", "base32hex"],
        [base32crockford.replaceAll("=", "") + "A", "base32crockford"],
      ] as const
    ) {
      assertThrows(
        () => decodeBase32(input, { alphabet }),
        RangeError,
        `Length (${input.length}), excluding padding, must not have a remainder of 1, 3, or 6 when divided by 8`,
        alphabet,
      );
    }
  }
});

Deno.test("decodeBase32() invalid char", () => {
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;

    for (
      const [input, alphabet] of [
        [".".repeat(8) + base32, "base32"],
        [".".repeat(8) + base32hex, "base32hex"],
        [".".repeat(8) + base32crockford, "base32crockford"],
      ] as const
    ) {
      assertThrows(
        () => decodeBase32(input, { alphabet }),
        TypeError,
        "Cannot decode input as base32: Invalid character (.)",
        alphabet,
      );
    }
  }
});

Deno.test("decodeBase32() throws with invalid byte >= 128", () => {
  const input = new TextDecoder().decode(new Uint8Array(5).fill(200));
  assertThrows(
    () => decodeBase32(input),
    TypeError,
    "Cannot decode input as base32: Invalid character",
  );
});
