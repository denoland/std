// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { fn } from "./fn.ts";
import { AssertionError, assertThrows } from "../assert/mod.ts";

Deno.test("expect().toHaveBeenNthCalledWith()", () => {
  const mockFn = fn();

  mockFn(1, 2, 3);
  mockFn(4, 5, 6);
  mockFn(7, 8, 9);

  expect(mockFn).toHaveBeenNthCalledWith(2, 4, 5, 6);

  expect(mockFn).not.toHaveBeenNthCalledWith(2, 1, 2, 3);
  expect(mockFn).not.toHaveBeenNthCalledWith(1, 4, 5, 6);

  assertThrows(() => {
    expect(mockFn).toHaveBeenNthCalledWith(2, 1, 2, 3);
  }, AssertionError);
  assertThrows(() => {
    expect(mockFn).toHaveBeenNthCalledWith(1, 4, 5, 6);
  }, AssertionError);

  assertThrows(() => {
    expect(mockFn).not.toHaveBeenNthCalledWith(2, 4, 5, 6);
  });
});

Deno.test("expect().toHaveBeenNthCalledWith() should throw when mock call does not exist", () => {
  const mockFn = fn();

  mockFn("hello");

  expect(mockFn).toHaveBeenNthCalledWith(1, "hello");
  assertThrows(
    () => {
      expect(mockFn).toHaveBeenNthCalledWith(2, "hello");
    },
    AssertionError,
    'Expected the n-th call (n=2) of mock function is with "hello", but the n-th call does not exist.',
  );
});
