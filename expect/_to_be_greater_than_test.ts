// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeGreaterThan()", () => {
  expect(11).toBeGreaterThan(10);

  expect(10).not.toBeGreaterThan(10);
  expect(9).not.toBeGreaterThan(10);

  assertThrows(() => {
    expect(10).toBeGreaterThan(10);
  }, AssertionError);
  assertThrows(() => {
    expect(9).toBeGreaterThan(10);
  });

  assertThrows(() => {
    expect(11).not.toBeGreaterThan(10);
  }, AssertionError);
});

Deno.test("expect().toBeGreaterThan() with custom error message message", () => {
  const msg = "toBeGreaterThan Custom Error";

  expect(() => expect(10, msg).toBeGreaterThan(10)).toThrow(
    new RegExp(`^${msg}`),
  );

  expect(() => expect(11, msg).not.toBeGreaterThan(10)).toThrow(
    new RegExp(`^${msg}`),
  );
});
