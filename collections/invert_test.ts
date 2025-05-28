// Copyright 2018-2025 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { invert, type InvertResult } from "./invert.ts";

function invertTest<T extends Record<PropertyKey, PropertyKey>>(
  input: Readonly<T>,
  expected: InvertResult<T>,
) {
  const actual = invert(input);
  assertEquals(actual, expected);
}

Deno.test("invert()", () => {
  invertTest({ a: "x", b: "y", c: "z" }, { x: "a", y: "b", z: "c" });
});

Deno.test("invert() handles empty input", () => {
  invertTest({}, {});
});

Deno.test("invert() handles duplicate values", () => {
  invertTest({ a: "x", b: "x", c: "z" }, { x: "b", z: "c" });
});

Deno.test("invert() handles nested input", () => {
  // @ts-expect-error - testing invalid input
  invertTest({ a: { b: "c" } }, { "[object Object]": "a" });
  // @ts-expect-error - testing invalid input
  invertTest({ a: "x", b: Object }, {
    "x": "a",
    [Object.toString()]: "b",
  });
  // @ts-expect-error - testing invalid input
  invertTest({ a: "x", b: ["y", "z"] }, { "x": "a", "y,z": "b" });
  // @ts-expect-error - testing invalid input
  invertTest({ a: "x", b: null }, { "x": "a", "null": "b" });
  // @ts-expect-error - testing invalid input
  invertTest({ a: "x", b: undefined }, { "x": "a", "undefined": "b" });
});
