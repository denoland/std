// Copyright 2018-2025 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeCloseTo()", () => {
  expect(0.2 + 0.1).toBeCloseTo(0.3);
  expect(0.2 + 0.1).toBeCloseTo(0.3, 5);
  expect(0.2 + 0.1).toBeCloseTo(0.3, 15);

  expect(0.2 + 0.11).not.toBeCloseTo(0.3);
  expect(0.2 + 0.1).not.toBeCloseTo(0.3, 16);

  assertThrows(() => {
    expect(0.2 + 0.11).toBeCloseTo(0.3);
  }, AssertionError);

  assertThrows(() => {
    expect(0.2 + 0.1).not.toBeCloseTo(0.3);
  });
});

Deno.test("expect().toBeCloseTo() throws error when the numDigits is smaller than 0", () => {
  assertThrows(
    () => expect(0.2 + 0.1).toBeCloseTo(0.3, -1),
    Error,
    "toBeCloseTo second argument must be a non-negative integer. Got -1",
  );
});

Deno.test("expect().toBeCloseTo() throws custom message", () => {
  const msg = "toBeCloseTo Custom Error";

  expect(() => expect(0.2 + 0.11, msg).toBeCloseTo(0.3)).toThrow(
    new RegExp(`^${msg}`),
  );

  expect(() => expect(0.2 + 0.1, msg).not.toBeCloseTo(0.3)).toThrow(
    new RegExp(`^${msg}`),
  );
});
