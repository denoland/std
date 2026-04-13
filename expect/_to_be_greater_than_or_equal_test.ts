// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeGreaterThanOrEqual()", () => {
  expect(10).toBeGreaterThanOrEqual(10);
  expect(11).toBeGreaterThanOrEqual(10);

  expect(9).not.toBeGreaterThanOrEqual(10);

  assertThrows(() => {
    expect(9).toBeGreaterThanOrEqual(10);
  }, AssertionError);

  assertThrows(() => {
    expect(11).not.toBeGreaterThanOrEqual(10);
  }, AssertionError);
});

Deno.test("expect().toBeGreaterThanOrEqual() with custom error message", () => {
  const msg = "toBeGreaterThanOrEqual Custom Error";

  expect(() => expect(10, msg).toBeGreaterThan(10)).toThrow(
    new RegExp(`^${msg}`),
  );

  expect(() => expect(11, msg).not.toBeGreaterThanOrEqual(10)).toThrow(
    new RegExp(`^${msg}`),
  );
});
