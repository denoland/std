// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { fn } from "./fn.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toHaveNthReturnedWith()", () => {
  const mockFn = fn((x: number) => x + 7);

  mockFn(1);
  mockFn(10);
  mockFn(100);
  mockFn(1000);

  expect(mockFn).toHaveNthReturnedWith(1, 8);
  expect(mockFn).toHaveNthReturnedWith(2, 17);
  expect(mockFn).toHaveNthReturnedWith(3, 107);
  expect(mockFn).toHaveNthReturnedWith(4, 1007);

  expect(mockFn).not.toHaveNthReturnedWith(1, 1);
  expect(mockFn).not.toHaveNthReturnedWith(2, 10);
  expect(mockFn).not.toHaveNthReturnedWith(3, 100);
  expect(mockFn).not.toHaveNthReturnedWith(4, 1000);

  assertThrows(() => {
    expect(mockFn).toHaveNthReturnedWith(1, 1);
  }, AssertionError);

  assertThrows(() => {
    expect(mockFn).not.toHaveNthReturnedWith(1, 8);
  }, AssertionError);

  assertThrows(() => {
    expect(mockFn).toHaveNthReturnedWith(0, 0);
  }, Error);
});

Deno.test("expect().toHaveNthReturnedWith() with custom error message", () => {
  const msg = "toHaveNthReturnedWith custom error message";
  const mockFn = fn((x: number) => x + 7);

  mockFn(1);
  mockFn(10);
  mockFn(100);
  mockFn(1000);

  expect(() => expect(mockFn, msg).toHaveNthReturnedWith(1, 1)).toThrow(
    new RegExp(`^${msg}`),
  );

  expect(() => expect(mockFn, msg).not.toHaveNthReturnedWith(1, 8)).toThrow(
    new RegExp(`^${msg}`),
  );
});
