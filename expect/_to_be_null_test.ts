// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeNull()", () => {
  expect(null).toBeNull();

  expect(undefined).not.toBeNull();

  assertThrows(() => {
    expect(undefined).toBeNull();
  }, AssertionError);

  assertThrows(() => {
    expect(null).not.toBeNull();
  }, AssertionError);
});
