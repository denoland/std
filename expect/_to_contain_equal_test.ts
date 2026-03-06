// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toContainEqual()", () => {
  const arr = [{ foo: 42 }, { bar: 43 }, { baz: 44 }];
  expect(arr).toContainEqual({ bar: 43 });

  expect(arr).not.toContainEqual({ bar: 42 });

  assertThrows(
    () => {
      expect(arr).toContainEqual({ bar: 42 });
    },
    AssertionError,
    `The value doesn't contain the expected item:
Value: [{foo: 42},{bar: 43},{baz: 44}]
Expected: {bar: 42}`,
  );

  assertThrows(
    () => {
      expect(arr).not.toContainEqual({ foo: 42 });
    },
    AssertionError,
    `The value contains the expected item:
Value: [{foo: 42},{bar: 43},{baz: 44}]
Expected: {foo: 42}`,
  );
});

Deno.test("expect().toContainEqual() handles null and undefined", () => {
  assertThrows(
    () => expect(null).not.toContainEqual("foo"),
    AssertionError,
    "The value is null or undefined",
  );
  assertThrows(
    () => expect(undefined).not.toContainEqual("foo"),
    AssertionError,
    "The value is null or undefined",
  );
});

Deno.test("expect().toContainEqual() throws error when the value is not an array", () => {
  assertThrows(
    () => expect({ foo: 42 }).toContainEqual({ foo: 42 }),
    AssertionError,
    "The value is not iterable",
  );
});

Deno.test("expect().toContainEqual() with custom error message", () => {
  const msg = "toContainEqual Custom Error";

  expect(() =>
    expect([{ foo: 42 }, { bar: 43 }, { baz: 44 }], msg).toContainEqual({
      foo: 4,
    })
  ).toThrow(new RegExp(`^${msg}`));
  expect(() =>
    expect([{ foo: 42 }, { bar: 43 }, { baz: 44 }], msg).not.toContainEqual({
      foo: 42,
    })
  ).toThrow(new RegExp(`^${msg}`));
});
