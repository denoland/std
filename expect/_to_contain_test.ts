// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toContain()", () => {
  const arr = [1, 2, 3];

  expect(arr).toContain(2);
  expect("foobarbaz").toContain("bar");

  expect(arr).not.toContain(4);
  expect("foobarbaz").not.toContain("qux");

  assertThrows(() => {
    expect(arr).toContain(4);
  }, AssertionError);
  assertThrows(
    () => {
      expect("foobarbaz").toContain("qux");
    },
    AssertionError,
    `The value "foobarbaz" doesn't contain the expected item "qux"`,
  );

  assertThrows(() => {
    expect(arr).not.toContain(2);
  }, AssertionError);
  assertThrows(
    () => {
      expect("foobarbaz").not.toContain("bar");
    },
    AssertionError,
    'The value "foobarbaz" contains the expected item "bar"',
  );
});

Deno.test("expect().toContain() with custom error message", () => {
  const arr = [1, 2, 3];
  const msg = "toContain Custom Error";

  expect(() => expect(arr, msg).not.toContain(2)).toThrow(new RegExp(`${msg}`));
  expect(() => expect("foobarbaz", msg).not.toContain("bar")).toThrow(
    new RegExp(`${msg}`),
  );
});
