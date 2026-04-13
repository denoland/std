// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeInstanceOf()", () => {
  expect(new Error()).toBeInstanceOf(Error);
  expect(new Error()).toBeInstanceOf(Object);

  expect(new Error()).not.toBeInstanceOf(String);

  assertThrows(() => {
    expect(new Error()).toBeInstanceOf(String);
  }, AssertionError);

  assertThrows(() => {
    expect(new Error()).not.toBeInstanceOf(Error);
  }, AssertionError);
  assertThrows(() => {
    expect(new Error()).not.toBeInstanceOf(Object);
  }, AssertionError);
});
