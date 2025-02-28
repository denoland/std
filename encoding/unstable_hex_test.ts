// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { concat } from "@std/bytes";
import {
  calcMax,
  decodeHex,
  decodeRawHex,
  encodeHex,
  encodeRawHex,
} from "./unstable_hex.ts";

const inputOutput: [string | ArrayBuffer, string][] = [
  ["", ""],
  ["Z", "5a"],
  ["ZZ", "5a5a"],
  [new Uint8Array(0).fill("Z".charCodeAt(0)).buffer, ""],
  [new Uint8Array(1).fill("Z".charCodeAt(0)).buffer, "5a"],
  [new Uint8Array(2).fill("Z".charCodeAt(0)).buffer, "5a5a"],
];

Deno.test("encodeHex()", () => {
  for (const [input, hex] of inputOutput) {
    assertEquals(encodeHex(input.slice(0), "Hex"), hex, "Hex");
  }
});

Deno.test("encodeHex() subarray", () => {
  for (const [input, hex] of inputOutput) {
    if (typeof input === "string") continue;

    const buffer = new Uint8Array(10);
    buffer.set(new Uint8Array(input), 10 - input.byteLength);

    assertEquals(
      encodeHex(buffer.slice().subarray(10 - input.byteLength), "Hex"),
      hex,
      "Hex",
    );
  }
});

Deno.test("encodeRawHex()", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input, hex] of inputOutput) {
    if (typeof input === "string") continue;

    for (
      const [output, format] of [
        [concat([prefix, new TextEncoder().encode(hex)]), "Hex"],
      ] as const
    ) {
      const buffer = new Uint8Array(prefix.length + calcMax(input.byteLength));
      buffer.set(prefix);
      buffer.set(new Uint8Array(input), buffer.length - input.byteLength);

      encodeRawHex(
        buffer,
        buffer.length - input.byteLength,
        prefix.length,
        format,
      );
      assertEquals(buffer, output, format);
    }
  }
});

Deno.test("encodeRawHex() with too small buffer", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input] of inputOutput) {
    if (typeof input === "string" || input.byteLength === 0) continue;

    for (const format of ["Hex"] as const) {
      const buffer = new Uint8Array(
        prefix.length + calcMax(input.byteLength) - 2,
      );
      buffer.set(prefix);
      buffer.set(new Uint8Array(input), buffer.length - input.byteLength);

      assertThrows(
        () =>
          encodeRawHex(
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

Deno.test("decodeHex()", () => {
  for (const [input, hex] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;
    const output = new TextEncoder().encode(input);

    assertEquals(decodeHex(hex, "Hex"), output, "Hex");
  }
});

Deno.test("decodeHex() invalid length", () => {
  for (const [input, hex] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;

    for (
      const [input, format] of [
        [hex + "a", "Hex"],
      ] as const
    ) {
      assertThrows(
        () => decodeHex(input, format),
        TypeError,
        "Invalid Character (a)",
        format,
      );
    }
  }
});

Deno.test("decodeHex() invalid char", () => {
  for (const [input, hex] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;

    for (
      const [input, format] of [
        [".".repeat(2) + hex, "Hex"],
      ] as const
    ) {
      assertThrows(
        () => decodeHex(input, format),
        TypeError,
        "Invalid Character (.)",
        format,
      );
    }
  }
});

Deno.test("decodeRawHex()", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [output, hex] of inputOutput) {
    if (typeof output === "string") continue;

    for (
      const [input, format] of [
        [concat([prefix, new TextEncoder().encode(hex)]), "Hex"],
      ] as const
    ) {
      assertEquals(
        input.subarray(
          prefix.length,
          decodeRawHex(input, prefix.length, prefix.length, format),
        ),
        new Uint8Array(output),
        format,
      );
    }
  }
});

Deno.test("decodeRawHex() with invalid offsets", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [output, hex] of inputOutput) {
    if (typeof output === "string") continue;

    for (
      const [input, format] of [
        [concat([prefix, new TextEncoder().encode(hex)]), "Hex"],
      ] as const
    ) {
      assertThrows(
        () => decodeRawHex(input, prefix.length - 2, prefix.length, format),
        RangeError,
        "Input (i) must be greater than or equal to output (o)",
      );
    }
  }
});
