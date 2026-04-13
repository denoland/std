// Copyright 2018-2026 the Deno authors. MIT license.

import { expect } from "./expect.ts";
import { AssertionError, assertThrows } from "@std/assert";

Deno.test("expect().toBeTruthy()", () => {
  expect(1).toBeTruthy();
  expect("hello").toBeTruthy();
  expect({}).toBeTruthy();

  expect(0).not.toBeTruthy();
  expect("").not.toBeTruthy();
  expect(null).not.toBeTruthy();
  expect(undefined).not.toBeTruthy();

  assertThrows(() => {
    expect(0).toBeTruthy();
  }, AssertionError);
  assertThrows(() => {
    expect("").toBeTruthy();
  }, AssertionError);
  assertThrows(() => {
    expect(null).toBeTruthy();
  }, AssertionError);
  assertThrows(() => {
    expect(undefined).toBeTruthy();
  }, AssertionError);

  assertThrows(() => {
    expect(1).not.toBeTruthy();
  }, AssertionError);
  assertThrows(() => {
    expect("hello").not.toBeTruthy();
  }, AssertionError);
  assertThrows(() => {
    expect({}).not.toBeTruthy();
  }, AssertionError);
});

Deno.test("expect().toBeTruthy() with custom error message message", () => {
  const msg = "toBeTruthy Custom Error";
  expect(() => expect(0, msg).toBeTruthy()).toThrow(new RegExp(`^${msg}`));
  expect(() => expect({}, msg).not.toBeTruthy()).toThrow(new RegExp(`^${msg}`));
});
