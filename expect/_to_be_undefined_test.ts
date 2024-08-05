// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeUndefined()", () => {
  expect(undefined).toBeUndefined();

  expect(null).not.toBeUndefined();

  assertThrows(() => {
    expect(null).toBeUndefined();
  }, AssertionError);

  assertThrows(() => {
    expect(undefined).not.toBeUndefined();
  }, AssertionError);
});
