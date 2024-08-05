// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { fn } from "./fn.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toHaveBeenLastCalledWith() checks the last call of mock function", () => {
  const mockFn = fn();

  mockFn(1, 2, 3);
  mockFn(4, 5, 6);

  expect(mockFn).toHaveBeenLastCalledWith(4, 5, 6);

  expect(mockFn).not.toHaveBeenLastCalledWith(1, 2, 3);

  assertThrows(() => {
    expect(mockFn).toHaveBeenLastCalledWith(1, 2, 3);
  }, AssertionError);

  assertThrows(() => {
    expect(mockFn).not.toHaveBeenLastCalledWith(4, 5, 6);
  }, AssertionError);
});

Deno.test("expect().toHaveBeenLastCalledWith() handles the case when the mock is not called", () => {
  const mockFn = fn();

  expect(mockFn).not.toHaveBeenLastCalledWith(1, 2, 3);
  assertThrows(
    () => expect(mockFn).toHaveBeenLastCalledWith(1, 2, 3),
    AssertionError,
    "Expected mock function to be last called with 1, 2, 3, but it was not.",
  );
});
