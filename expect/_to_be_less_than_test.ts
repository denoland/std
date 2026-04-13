// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeLessThan()", () => {
  expect(9).toBeLessThan(10);

  expect(10).not.toBeLessThan(10);
  expect(11).not.toBeLessThan(10);

  assertThrows(() => {
    expect(10).toBeLessThan(10);
  }, AssertionError);
  assertThrows(() => {
    expect(11).toBeLessThan(10);
  }, AssertionError);

  assertThrows(() => {
    expect(9).not.toBeLessThan(10);
  }, AssertionError);
});

Deno.test("expect().toBeLessThan() with custom error message", () => {
  const msg = "toBeLessThan Custom Error";

  expect(() => expect(10, msg).toBeLessThan(10)).toThrow(new RegExp(`^${msg}`));
  expect(() => expect(9, msg).not.toBeLessThan(10)).toThrow(
    new RegExp(`^${msg}`),
  );
});
