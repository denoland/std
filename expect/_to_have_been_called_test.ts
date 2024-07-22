// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { assertThrows } from "@std/assert";
import { expect } from "./expect.ts";
import { fn } from "./fn.ts";

Deno.test("expect().toHaveBeenCalled() checks the mock call", () => {
  const mockFn = fn();
  mockFn();

  expect(mockFn).toHaveBeenCalled();

  assertThrows(
    () => expect(mockFn).not.toHaveBeenCalled(),
    Error,
    "Expected mock function not to be called, but it was called 1 time(s)",
  );
});

Deno.test("expect().toHaveBeenCalled() handles the case when the mock is not called", () => {
  const mockFn = fn();

  expect(mockFn).not.toHaveBeenCalled();

  assertThrows(
    () => expect(mockFn).toHaveBeenCalled(),
    Error,
    "Expected mock function to be called, but it was not called",
  );
});
