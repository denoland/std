// Copyright 2018-2025 the Deno authors. MIT license.
// deno-lint-ignore-file no-explicit-any

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeDefined()", () => {
  expect(1).toBeDefined();
  expect("a").toBeDefined();

  expect(undefined).not.toBeDefined();
  expect(({} as any).foo).not.toBeDefined();

  assertThrows(() => {
    expect(undefined).toBeDefined();
  }, AssertionError);
  assertThrows(() => {
    expect(({} as any).foo).toBeDefined();
  }, AssertionError);

  assertThrows(() => {
    expect(1).not.toBeDefined();
  }, AssertionError);
  assertThrows(() => {
    expect("a").not.toBeDefined();
  }, AssertionError);
});
