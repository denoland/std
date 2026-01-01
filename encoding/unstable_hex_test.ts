// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals, assertThrows } from "@std/assert";
import { concat } from "@std/bytes";
import {
  calcSizeHex,
  decodeHex,
  encodeHex,
  encodeIntoHex,
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

Deno.test("encodeHexInto()", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input, output] of inputOutput) {
    if (typeof input === "string") continue;

    const buffer = new Uint8Array(
      prefix.length + calcSizeHex(input.byteLength),
    );
    buffer.set(prefix);

    encodeIntoHex(
      input,
      buffer.subarray(prefix.length),
    );
    assertEquals(buffer, concat([prefix, new TextEncoder().encode(output)]));
  }
});

Deno.test("encodeHexInto() with too small buffer", () => {
  const prefix = new TextEncoder().encode("data:fake/url,");
  for (const [input] of inputOutput) {
    if (typeof input === "string" || input.byteLength === 0) continue;

    const buffer = new Uint8Array(
      prefix.length + calcSizeHex(input.byteLength) - 2,
    );
    buffer.set(prefix);
    buffer.set(new Uint8Array(input), buffer.length - input.byteLength);

    assertThrows(
      () =>
        encodeIntoHex(
          input,
          buffer.subarray(prefix.length),
        ),
      RangeError,
      "Cannot encode input as hex: Output too small",
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
      RangeError,
      `Cannot decode input as hex: Length (${
        output.length + 1
      }) must be divisible by 2`,
    );
  }
});

Deno.test("decodeHex() invalid char", () => {
  for (const [input, output] of inputOutput) {
    if (input instanceof ArrayBuffer) continue;

    assertThrows(
      () => decodeHex(".".repeat(2) + output),
      TypeError,
      "Cannot decode input as hex: Invalid character (.)",
    );
  }
});

Deno.test("decodeHex() throws with invalid byte >= 128", () => {
  const input = new TextDecoder().decode(new Uint8Array(2).fill(200));
  assertThrows(
    () => decodeHex(input),
    TypeError,
    "Cannot decode input as hex: Invalid character",
  );
});
