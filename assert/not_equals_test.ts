// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
import { AssertionError, assertNotEquals, assertThrows } from "./mod.ts";

Deno.test("assertNotEquals()", () => {
  assertNotEquals<unknown>({ foo: "bar" }, { bar: "foo" });
  assertNotEquals("Denosaurus", "Tyrannosaurus");
  assertNotEquals(
    new Date(2019, 0, 3, 4, 20, 1, 10),
    new Date(2019, 0, 3, 4, 20, 1, 20),
  );
  assertNotEquals(new Date("invalid"), new Date(2019, 0, 3, 4, 20, 1, 20));
});

Deno.test("assertNotEquals() throws", () => {
  assertThrows(
    () => {
      assertNotEquals("foo", "foo");
    },
    AssertionError,
    "Expected actual: foo not to be: foo.",
  );
});

Deno.test("assertNotEquals() throws with custom message", () => {
  assertThrows(
    () => {
      assertNotEquals("foo", "foo", "CUSTOM MESSAGE");
    },
    AssertionError,
    "Expected actual: foo not to be: foo: CUSTOM MESSAGE",
  );
});
