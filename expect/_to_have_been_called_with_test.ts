// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { fn } from "./fn.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toHaveBeenCalledWith()", () => {
  const mockFn = fn();
  mockFn("hello", "deno");

  expect(mockFn).toHaveBeenCalledWith("hello", "deno");

  expect(mockFn).not.toHaveBeenCalledWith("hello", "DENO");

  assertThrows(() => {
    expect(mockFn).toHaveBeenCalledWith("hello", "DENO");
  }, AssertionError);

  assertThrows(() => {
    expect(mockFn).not.toHaveBeenCalledWith("hello", "deno");
  });
});
