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
    assertEquals(encodeHex(input.slice(0)), hex);
  }
});

Deno.test("encodeHex() subarray", () => {
  for (const [input, output] of inputOutput) {
    if (typeof input === "string") continue;

    const buffer = new Uint8Array(10);
    buffer.set(new Uint8Array(input), 10 - input.byteLength);

    assertEquals(
      encodeHex(buffer.slice().subarray(10 - input.byteLength)),
      output,
    );
  }
});

Deno.test("encodeRawHex()", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input, output] of inputOutput) {
    if (typeof input === "string") continue;

    const buffer = new Uint8Array(prefix.length + calcMax(input.byteLength));
    buffer.set(prefix);
    buffer.set(new Uint8Array(input), buffer.length - input.byteLength);

    encodeRawHex(
      buffer,
      buffer.length - input.byteLength,
      prefix.length,
    );
    assertEquals(buffer, concat([prefix, new TextEncoder().encode(output)]));
  }
});

Deno.test("encodeRawHex() with too small buffer", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input] of inputOutput) {
    if (typeof input === "string" || input.byteLength === 0) continue;

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
        ),
      RangeError,
      "Buffer too small",
    );
  }
});

Deno.test("decodeHex()", () => {
  for (const [input, output] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;

    assertEquals(decodeHex(output), new TextEncoder().encode(input));
  }
});

Deno.test("decodeHex() invalid length", () => {
  for (const [input, output] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;

    assertThrows(
      () => decodeHex(output + "a"),
      TypeError,
      "Invalid Character (a)",
    );
  }
});

Deno.test("decodeHex() invalid char", () => {
  for (const [input, output] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;

    assertThrows(
      () => decodeHex(".".repeat(2) + output),
      TypeError,
      "Invalid Character (.)",
    );
  }
});

Deno.test("decodeRawHex()", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input, output] of inputOutput) {
    if (typeof input === "string") continue;

    const buffer = concat([prefix, new TextEncoder().encode(output)]);
    assertEquals(
      buffer.subarray(
        prefix.length,
        decodeRawHex(buffer, prefix.length, prefix.length),
      ),
      new Uint8Array(input),
    );
  }
});

Deno.test("decodeRawHex() with invalid offsets", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input, output] of inputOutput) {
    if (typeof input === "string") continue;

    assertThrows(
      () =>
        decodeRawHex(
          concat([prefix, new TextEncoder().encode(output)]),
          prefix.length - 2,
          prefix.length,
        ),
      RangeError,
      "Input (i) must be greater than or equal to output (o)",
    );
  }
});

Deno.test("decodeHex() throws with invalid byte >= 128", () => {
  const input = new TextDecoder().decode(new Uint8Array(2).fill(200));
  assertThrows(
    () => decodeHex(input),
    TypeError,
    "Invalid Character",
  );
});
