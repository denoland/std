// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";
import { fn } from "./fn.ts";

Deno.test("expect.anything() as a parameter of toEqual()", () => {
  expect(null).not.toEqual(expect.anything());
  expect(undefined).not.toEqual(expect.anything());
  expect(1).toEqual(expect.anything());

  assertThrows(() => {
    expect(null).toEqual(expect.anything());
  }, AssertionError);
  assertThrows(() => {
    expect(undefined).toEqual(expect.anything());
  }, AssertionError);
  assertThrows(() => {
    expect(1).not.toEqual(expect.anything());
  }, AssertionError);
});

Deno.test("expect.anything() as a parameter of toHaveBeenCalled()", () => {
  const mockFn = fn();
  mockFn(3);
  expect(mockFn).toHaveBeenCalledWith(expect.anything());
});
