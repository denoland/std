// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeLessThanOrEqual()", () => {
  expect(10).toBeLessThanOrEqual(10);
  expect(9).toBeLessThanOrEqual(10);

  expect(11).not.toBeLessThanOrEqual(10);

  assertThrows(() => {
    expect(11).toBeLessThanOrEqual(10);
  }, AssertionError);

  assertThrows(() => {
    expect(10).not.toBeLessThanOrEqual(10);
  }, AssertionError);
  assertThrows(() => {
    expect(9).not.toBeLessThanOrEqual(10);
  }, AssertionError);
});

Deno.test("expect().toBeLessThanOrEqual() with custom error message", () => {
  const msg = "toBeLessThanOrEqual Custom Error";

  expect(() => expect(11, msg).toBeLessThanOrEqual(10)).toThrow(
    new RegExp(`^${msg}`),
  );

  expect(() => expect(9, msg).not.toBeLessThanOrEqual(10)).toThrow(
    new RegExp(`^${msg}`),
  );
});
