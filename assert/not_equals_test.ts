// Copyright 2018-2025 the Deno authors. MIT license.
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
    'Expected actual: "foo" not to be: "foo".',
  );
  assertThrows(
    () => {
      assertNotEquals({ foo: 1 }, { foo: 1 });
    },
    AssertionError,
    `Expected actual: {
  foo: 1,
} not to be: {
  foo: 1,
}.`,
  );
});

Deno.test("assertNotEquals() throws with custom message", () => {
  assertThrows(
    () => {
      assertNotEquals("foo", "foo", "CUSTOM MESSAGE");
    },
    AssertionError,
    'Expected actual: "foo" not to be: "foo": CUSTOM MESSAGE',
  );
});
