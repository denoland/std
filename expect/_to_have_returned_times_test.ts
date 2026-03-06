// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { fn } from "./fn.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toHaveReturnedTimes()", () => {
  const mockFn = fn();

  mockFn();
  mockFn();

  expect(mockFn).toHaveReturnedTimes(2);

  expect(mockFn).not.toHaveReturnedTimes(1);

  assertThrows(() => {
    expect(mockFn).toHaveReturnedTimes(1);
  }, AssertionError);

  assertThrows(() => {
    expect(mockFn).not.toHaveReturnedTimes(2);
  }, AssertionError);
});

Deno.test("expect().toHaveReturnedTimes() with custom error message", () => {
  const msg = "toHaveReturnedTimes custom error message";
  const mockFn = fn();

  mockFn();
  mockFn();

  expect(() => expect(mockFn, msg).toHaveReturnedTimes(1)).toThrow(
    new RegExp(`^${msg}`),
  );

  expect(() => expect(mockFn, msg).not.toHaveReturnedTimes(2)).toThrow(
    new RegExp(`^${msg}`),
  );
});
