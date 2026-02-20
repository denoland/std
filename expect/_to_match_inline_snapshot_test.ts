// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().not.toMatchInlineSnapshot() throws", () => {
  assertThrows(
    () => {
      expect("foo").not.toMatchInlineSnapshot(`"foo"`);
    },
    AssertionError,
    "Snapshot matchers do not support `.not`",
  );
});

Deno.test("expect().toMatchInlineSnapshot() matches simple string", () => {
  expect("hello").toMatchInlineSnapshot(`"hello"`);
});

Deno.test("expect().toMatchInlineSnapshot() matches number", () => {
  expect(42).toMatchInlineSnapshot(`42`);
});

Deno.test("expect().toMatchInlineSnapshot() matches object", () => {
  expect({ foo: 1, bar: 2 }).toMatchInlineSnapshot(`
{
  bar: 2,
  foo: 1,
}
`);
});

Deno.test("expect().toMatchInlineSnapshot() matches array", () => {
  expect([1, 2, 3]).toMatchInlineSnapshot(`
[
  1,
  2,
  3,
]
`);
});

Deno.test("expect().toMatchInlineSnapshot() matches boolean", () => {
  expect(true).toMatchInlineSnapshot(`true`);
});

Deno.test("expect().toMatchInlineSnapshot() matches null", () => {
  expect(null).toMatchInlineSnapshot(`null`);
});

Deno.test("expect().toMatchInlineSnapshot() throws on mismatch", () => {
  assertThrows(
    () => {
      expect("actual").toMatchInlineSnapshot(`"expected"`);
    },
    AssertionError,
    "Inline snapshot does not match",
  );
});

Deno.test("expect().toMatchInlineSnapshot() throws when no snapshot in assert mode", () => {
  assertThrows(
    () => {
      expect("foo").toMatchInlineSnapshot();
    },
    AssertionError,
    "Missing inline snapshot argument",
  );
});

Deno.test("expect().toMatchInlineSnapshot() with property matchers rejects non-object", () => {
  assertThrows(
    () => {
      expect("string value").toMatchInlineSnapshot(
        { id: expect.any(Number) },
        `"string value"`,
      );
    },
    AssertionError,
    "Property matchers can only be used with object values in toMatchInlineSnapshot",
  );
});

Deno.test("expect().toMatchInlineSnapshot() with property matchers rejects mismatch", () => {
  assertThrows(
    () => {
      expect({ id: "not a number" }).toMatchInlineSnapshot(
        { id: expect.any(Number) },
        `{ id: "not a number" }`,
      );
    },
    AssertionError,
    "Property matchers did not match",
  );
});

Deno.test("expect().toMatchInlineSnapshot() matches nested objects", () => {
  expect({
    name: "Alice",
    profile: { age: 30 },
  }).toMatchInlineSnapshot(`
{
  name: "Alice",
  profile: {
    age: 30,
  },
}
`);
});
