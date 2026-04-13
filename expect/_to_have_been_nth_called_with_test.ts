// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { fn } from "./fn.ts";
import { AssertionError, assertThrows } from "@std/assert";

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
    'Expected the n-th call (n=2) of mock function is with "hello", but the n-th call does not exist',
  );
});

Deno.test("expect().toHaveBeenNthCalledWith() throw when n is not a positive integer", () => {
  const mockFn = fn();

  assertThrows(
    () => {
      expect(mockFn).toHaveBeenNthCalledWith(0, "hello");
    },
    Error,
    "nth must be greater than 0: received 0",
  );
});

Deno.test("expect().toHaveBeenNthCalledWith() with custom error message", () => {
  const msg = "toHaveBeenNthCalledWith custom error message";
  const mockFn = fn();

  mockFn(1, 2, 3);
  mockFn(4, 5, 6);
  mockFn(7, 8, 9);

  expect(() => expect(mockFn, msg).not.toHaveBeenNthCalledWith(1, 1, 2, 3))
    .toThrow(new RegExp(`^${msg}`));
  expect(() => expect(mockFn, msg).toHaveBeenNthCalledWith(1, 4, 5, 6)).toThrow(
    new RegExp(`^${msg}`),
  );
});
