// Copyright 2018-2025 the Deno authors. MIT license.
import {
  assertEquals,
  assertExists,
  AssertionError,
  assertThrows,
} from "./mod.ts";

Deno.test("assertExists() matches values that are not null or undefined", () => {
  assertExists("Denosaurus");
  assertExists(false);
  assertExists(0);
  assertExists("");
  assertExists(-0);
  assertExists(0);
  assertExists(NaN);

  const value = new URLSearchParams({ value: "test" }).get("value");
  assertExists(value);
  assertEquals(value.length, 4);
});

Deno.test("assertExists() throws when value is null or undefined", () => {
  assertThrows(
    () => assertExists(undefined),
    AssertionError,
    'Expected actual: "undefined" to not be null or undefined.',
  );
  assertThrows(
    () => assertExists(null),
    AssertionError,
    'Expected actual: "null" to not be null or undefined.',
  );
});

Deno.test("assertExists() throws with custom message", () => {
  assertThrows(
    () => assertExists(undefined, "CUSTOM MESSAGE"),
    AssertionError,
    'Expected actual: "undefined" to not be null or undefined: CUSTOM MESSAGE',
  );
});
