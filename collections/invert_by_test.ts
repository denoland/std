// Copyright 2018-2026 the Deno authors. MIT license.

import { assertEquals } from "@std/assert";
import { invertBy } from "./invert_by.ts";

function invertByTest<R extends Record<PropertyKey, PropertyKey>>(
  input: [Readonly<R>, (key: PropertyKey) => PropertyKey],
  expected: Record<PropertyKey, PropertyKey[]>,
) {
  const actual = invertBy(...input);
  assertEquals(actual, expected);
}

Deno.test("invertBy()", () => {
  invertByTest(
    [{ a: "x", b: "y", c: "z" }, (key) => String(key).toUpperCase()],
    { X: ["a"], Y: ["b"], Z: ["c"] },
  );
});

Deno.test("invertBy() handles empty input", () => {
  invertByTest(
    [{}, (key) => key],
    {},
  );
});

Deno.test("invertBy() handles duplicate values", () => {
  invertByTest(
    [{ a: "x", b: "x", c: "z" }, (key) => key],
    { x: ["a", "b"], z: ["c"] },
  );
});
