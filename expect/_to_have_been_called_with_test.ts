// Copyright 2018-2026 the Deno authors. MIT license.

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

Deno.test("expect().toHaveBeenCalledWith() with custom error message", () => {
  const msg = "toHaveBeenCalledWith custom error message";
  const mockFn = fn();
  mockFn("hello", "deno");

  expect(() => expect(mockFn, msg).toHaveBeenCalledWith("hello", "DENO"))
    .toThrow(new RegExp(`^${msg}`));

  expect(() => expect(mockFn, msg).not.toHaveBeenCalledWith("hello", "deno"))
    .toThrow(new RegExp(`^${msg}`));
});
