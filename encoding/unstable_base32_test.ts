// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { concat } from "@std/bytes";
import {
  calcMax,
  decodeBase32,
  decodeRawBase32,
  encodeBase32,
  encodeRawBase32,
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
    assertEquals(encodeBase32(input.slice(0), "Base32"), base32, "Base32");
    assertEquals(
      encodeBase32(input.slice(0), "Base32Hex"),
      base32hex,
      "Base32Hex",
    );
    assertEquals(
      encodeBase32(input.slice(0), "Base32Crockford"),
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
      encodeBase32(buffer.slice().subarray(10 - input.byteLength), "Base32"),
      base32,
      "Base32",
    );
    assertEquals(
      encodeBase32(buffer.slice().subarray(10 - input.byteLength), "Base32Hex"),
      base32hex,
      "Base32Hex",
    );
    assertEquals(
      encodeBase32(
        buffer.slice().subarray(10 - input.byteLength),
        "Base32Crockford",
      ),
      base32crockford,
      "Base32Crockford",
    );
  }
});

Deno.test("encodeRawBase32()", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (typeof input === "string") continue;

    for (
      const [output, format] of [
        [concat([prefix, new TextEncoder().encode(base32)]), "Base32"],
        [concat([prefix, new TextEncoder().encode(base32hex)]), "Base32Hex"],
        [
          concat([prefix, new TextEncoder().encode(base32crockford)]),
          "Base32Crockford",
        ],
      ] as const
    ) {
      const buffer = new Uint8Array(prefix.length + calcMax(input.byteLength));
      buffer.set(prefix);
      buffer.set(new Uint8Array(input), buffer.length - input.byteLength);

      encodeRawBase32(
        buffer,
        buffer.length - input.byteLength,
        prefix.length,
        format,
      );
      assertEquals(buffer, output, format);
    }
  }
});

Deno.test("encodeRawBase32() with too small buffer", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input] of inputOutput) {
    if (typeof input === "string" || input.byteLength === 0) continue;

    for (const format of ["Base32", "Base32Hex", "Base32Crockford"] as const) {
      const buffer = new Uint8Array(
        prefix.length + calcMax(input.byteLength) - 2,
      );
      buffer.set(prefix);
      buffer.set(new Uint8Array(input), buffer.length - input.byteLength);

      assertThrows(
        () =>
          encodeRawBase32(
            buffer,
            buffer.length - input.byteLength,
            prefix.length,
            format,
          ),
        RangeError,
        "Buffer too small",
        format,
      );
    }
  }
});

Deno.test("decodeBase32()", () => {
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;
    const output = new TextEncoder().encode(input);

    assertEquals(decodeBase32(base32, "Base32"), output, "Base32");
    assertEquals(decodeBase32(base32hex, "Base32Hex"), output, "Base32Hex");
    assertEquals(
      decodeBase32(base32crockford, "Base32Crockford"),
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
      const [input, format] of [
        [base32.substring(-1) + ".", "Base32"],
        [base32hex.substring(-1) + ".", "Base32Hex"],
        [base32crockford.substring(-1) + ".", "Base32Crockford"],
      ] as const
    ) {
      assertThrows(
        () => decodeBase32(input, format),
        TypeError,
        "Invalid Character (.)",
        format,
      );
    }
  }
});

Deno.test("decodeBase32() invalid length", () => {
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;
    if (input.length === 4 || input.length === 2) continue;

    for (
      const [input, format] of [
        [base32.replaceAll("=", "") + "A", "Base32"],
        [base32hex.replaceAll("=", "") + "A", "Base32Hex"],
        [base32crockford.replaceAll("=", "") + "A", "Base32Crockford"],
      ] as const
    ) {
      assertThrows(
        () => decodeBase32(input, format),
        TypeError,
        "Invalid Character (A)",
        format,
      );
    }
  }
});

Deno.test("decodeBase32() invalid char", () => {
  for (const [input, base32, base32hex, base32crockford] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;

    for (
      const [input, format] of [
        [".".repeat(8) + base32, "Base32"],
        [".".repeat(8) + base32hex, "Base32Hex"],
        [".".repeat(8) + base32crockford, "Base32Crockford"],
      ] as const
    ) {
      assertThrows(
        () => decodeBase32(input, format),
        TypeError,
        "Invalid Character (.)",
        format,
      );
    }
  }
});

Deno.test("decodeRawBase32()", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [output, base32, base32hex, base32crockford] of inputOutput) {
    if (typeof output === "string") continue;

    for (
      const [input, format] of [
        [concat([prefix, new TextEncoder().encode(base32)]), "Base32"],
        [concat([prefix, new TextEncoder().encode(base32hex)]), "Base32Hex"],
        [
          concat([prefix, new TextEncoder().encode(base32crockford)]),
          "Base32Crockford",
        ],
      ] as const
    ) {
      assertEquals(
        input.subarray(
          prefix.length,
          decodeRawBase32(input, prefix.length, prefix.length, format),
        ),
        new Uint8Array(output),
        format,
      );
    }
  }
});

Deno.test("decodeRawBase32() with invalid offsets", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [output, base32, base32hex, base32crockford] of inputOutput) {
    if (typeof output === "string") continue;

    for (
      const [input, format] of [
        [concat([prefix, new TextEncoder().encode(base32)]), "Base32"],
        [concat([prefix, new TextEncoder().encode(base32hex)]), "Base32Hex"],
        [
          concat([prefix, new TextEncoder().encode(base32crockford)]),
          "Base32Crockford",
        ],
      ] as const
    ) {
      assertThrows(
        () => decodeRawBase32(input, prefix.length - 2, prefix.length, format),
        RangeError,
        "Input (i) must be greater than or equal to output (o)",
      );
    }
  }
});

Deno.test("decodeBase32() throws with invalid byte >= 128", () => {
  const input = new TextDecoder().decode(new Uint8Array(5).fill(200));
  assertThrows(
    () => decodeBase32(input),
    TypeError,
    "Invalid Character",
  );
});
