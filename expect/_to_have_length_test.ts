// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toHaveLength()", () => {
  expect([1, 2, 3]).toHaveLength(3);
  expect("abc").toHaveLength(3);

  expect([1, 2, 3]).not.toHaveLength(4);
  expect("abc").not.toHaveLength(4);

  assertThrows(() => {
    expect([1, 2, 3]).toHaveLength(4);
  }, AssertionError);
  assertThrows(() => {
    expect("abc").toHaveLength(4);
  }, AssertionError);

  assertThrows(() => {
    expect([1, 2, 3]).not.toHaveLength(3);
  }, AssertionError);
  assertThrows(() => {
    expect("abc").not.toHaveLength(3);
  }, AssertionError);
});

Deno.test("expect().toHaveLength() with custom error message", () => {
  const msg = "toHaveLength Custom Error";

  expect(() => {
    expect([1, 2, 3], msg).toHaveLength(4);
  }).toThrow(new RegExp(`^${msg}`));

  expect(() => {
    expect("abc", msg).not.toHaveLength(3);
  }).toThrow(new RegExp(`^${msg}`));
});
